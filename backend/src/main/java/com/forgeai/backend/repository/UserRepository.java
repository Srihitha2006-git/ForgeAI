package com.forgeai.backend.repository;

import com.forgeai.backend.entity.Role;
import com.forgeai.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    long countByRole(Role role);
    List<User> findTop10ByRoleOrderByIdDesc(Role role);
}
