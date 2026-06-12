package com.uzairtuition.support;

import java.util.List;

public record ThreadResponse(
        TicketResponse ticket,
        List<MessageResponse> messages
) {}
