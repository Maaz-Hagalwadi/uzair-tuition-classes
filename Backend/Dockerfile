FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY Backend/pom.xml .
RUN mvn dependency:go-offline -q
COPY Backend/src ./src
RUN mvn clean package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/uzair-tuition-lms-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8090
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-XX:+TieredCompilation", \
  "-XX:TieredStopAtLevel=1", \
  "-jar", "app.jar"]
