# Etapa 1: compila e empacota o projeto com Maven e Java 21.
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copia primeiro o pom.xml para aproveitar o cache das dependências.
COPY pom.xml .

RUN mvn -B dependency:go-offline

# Copia o código-fonte e gera o JAR executável.
COPY src ./src

RUN mvn -B clean package -DskipTests

# Etapa 2: executa a aplicação usando apenas o Java 21.
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Cria um usuário sem privilégios administrativos.
RUN groupadd --system spring \
    && useradd --system --gid spring spring

# Copia o JAR gerado na etapa de compilação.
COPY --from=build --chown=spring:spring \
    /app/target/orquestrador-ai-1.0.0.jar /app/app.jar

USER spring:spring

# Porta padrão do Spring Boot.
EXPOSE 8083

# Inicia a aplicação.
ENTRYPOINT ["java", "-jar", "/app/app.jar"]