package com.uzairtuition.batch;

import java.util.List;

public record BulkEnrollRequest(List<Long> studentIds) {}
