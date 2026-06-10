package com.uzairtuition.util;

import com.uzairtuition.exception.ResourceNotFoundException;
import java.util.Optional;

public final class EntityFinder {
    private EntityFinder() {}

    public static <T> T findOrThrow(Optional<T> optional, String entityName) {
        return optional.orElseThrow(() -> new ResourceNotFoundException(entityName + " not found."));
    }
}
