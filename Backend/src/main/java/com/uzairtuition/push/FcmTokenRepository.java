package com.uzairtuition.push;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface FcmTokenRepository extends JpaRepository<FcmToken, Long> {
    @Query("SELECT f.token FROM FcmToken f WHERE f.user.id = :userId")
    List<String> findTokensByUserId(Long userId);

    boolean existsByToken(String token);

    @Modifying
    @Query("DELETE FROM FcmToken f WHERE f.token = :token")
    void deleteByToken(String token);

    @Modifying
    @Query("DELETE FROM FcmToken f WHERE f.token IN :tokens")
    void deleteAllByTokenIn(List<String> tokens);
}
