package com.lifelink.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class RedisLockService {

    @Autowired(required = false)
    private StringRedisTemplate redisTemplate;

    // In-memory fallback map if Redis server is offline
    private final Map<String, Long> inMemoryLocks = new ConcurrentHashMap<>();

    public boolean acquireLock(String lockKey, long timeoutSeconds) {
        if (redisTemplate != null) {
            try {
                Boolean success = redisTemplate.opsForValue().setIfAbsent(lockKey, "LOCKED", Duration.ofSeconds(timeoutSeconds));
                if (Boolean.TRUE.equals(success)) {
                    return true;
                }
            } catch (Exception ex) {
                log.warn("Redis unavailable for lock {}, falling back to in-memory lock: {}", lockKey, ex.getMessage());
            }
        }

        // In-memory lock fallback
        long now = System.currentTimeMillis();
        Long expiry = inMemoryLocks.get(lockKey);
        if (expiry == null || expiry < now) {
            inMemoryLocks.put(lockKey, now + (timeoutSeconds * 1000));
            return true;
        }
        return false;
    }

    public void releaseLock(String lockKey) {
        if (redisTemplate != null) {
            try {
                redisTemplate.delete(lockKey);
            } catch (Exception ex) {
                log.warn("Failed to delete Redis lock {}: {}", lockKey, ex.getMessage());
            }
        }
        inMemoryLocks.remove(lockKey);
    }
}
