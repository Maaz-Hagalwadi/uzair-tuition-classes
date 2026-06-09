package com.uzairtuition.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {

    @Query("SELECT h FROM LoginHistory h JOIN FETCH h.user ORDER BY h.loggedInAt DESC LIMIT 100")
    List<LoginHistory> findTop100ByOrderByLoggedInAtDesc();

    @Query("SELECT h FROM LoginHistory h JOIN FETCH h.user WHERE h.user.id = :userId ORDER BY h.loggedInAt DESC")
    List<LoginHistory> findByUserIdOrderByLoggedInAtDesc(@Param("userId") Long userId);
}
