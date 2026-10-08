package com.lifelink.donor.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationDto {

    private static final GeometryFactory GEOMETRY_FACTORY = new GeometryFactory(new PrecisionModel(), 4326);

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90.0")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90.0")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180.0")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180.0")
    private Double longitude;

    public Point toPoint() {
        if (latitude == null || longitude == null) {
            return null;
        }
        // In GIS spatial coordinates, X is Longitude and Y is Latitude
        return GEOMETRY_FACTORY.createPoint(new Coordinate(longitude, latitude));
    }

    public static LocationDto fromPoint(Point point) {
        if (point == null) {
            return null;
        }
        return LocationDto.builder()
                .latitude(point.getY())
                .longitude(point.getX())
                .build();
    }
}
