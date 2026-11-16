<?php // File: isdalog/app/Jobs/SendSmsNotification.php

namespace App\Jobs;

use App\Services\SmsNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendSmsNotification implements \Illuminate\Contracts\Queue\ShouldBeEncrypted, ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $phoneNumber;

    public string $message;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var array<int, int>
     */
    public array $backoff = [10, 30, 60];

    /**
     * The number of seconds the job can run before timing out.
     */
    public int $timeout = 15;

    /**
     * Create a new job instance.
     */
    public function __construct(string $phoneNumber, string $message)
    {
        $this->phoneNumber = $phoneNumber;
        $this->message = $message;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $success = SmsNotificationService::send($this->phoneNumber, $this->message);

        if (! $success) {
            Log::warning('SMS dispatch unavailable or failed.');
            throw new \RuntimeException('SMS provider unavailable; no delivery confirmed.');
        }
    }

    /** Notification transport must not turn a committed sale into an HTTP failure. */
    public static function enqueue(string $phoneNumber, string $message): void
    {
        \Illuminate\Support\Facades\DB::afterCommit(function () use ($phoneNumber, $message) {
            try {
                self::dispatch($phoneNumber, $message);
            } catch (\Throwable $exception) {
                Log::warning('SMS job could not be delivered or queued after commit. Domain records remain committed.');
            }
        });
    }
}
