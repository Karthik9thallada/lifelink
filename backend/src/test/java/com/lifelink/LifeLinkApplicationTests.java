package com.lifelink;

import com.lifelink.auth.Role;
import com.lifelink.auth.User;
import com.lifelink.auth.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class LifeLinkApplicationTests {

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Spring Application Context loads successfully")
    void contextLoads() {
        assertThat(userRepository).isNotNull();
    }

    @Test
    @DisplayName("User entity can be created, saved, and queried from UserRepository")
    void testUserEntityPersistence() {
        User user = User.builder()
                .name("Rahul Sharma")
                .email("rahul.test@lifelink.org")
                .password("$2a$10$hashedpasswordforexample")
                .phone("+919876543210")
                .role(Role.DONOR)
                .build();

        User saved = userRepository.save(user);
        assertThat(saved.getId()).isNotNull();

        Optional<User> found = userRepository.findByEmail("rahul.test@lifelink.org");
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Rahul Sharma");
        assertThat(found.get().getRole()).isEqualTo(Role.DONOR);
    }
}
