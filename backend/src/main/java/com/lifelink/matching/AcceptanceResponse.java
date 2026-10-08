package com.lifelink.matching;

import com.lifelink.request.RequestStatus;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcceptanceResponse {

    private boolean success;
    private String message;
    private Long requestId;
    private Long donorId;
    private RequestStatus requestStatus;
    private Integer unitsFulfilled;
    private Integer unitsRequired;
}
