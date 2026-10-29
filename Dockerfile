# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /app

# Copy solution and projects from backend/
COPY backend/*.sln ./
COPY backend/MiCompuEdu.Domain/*.csproj ./MiCompuEdu.Domain/
COPY backend/MiCompuEdu.Application/*.csproj ./MiCompuEdu.Application/
COPY backend/MiCompuEdu.Infrastructure/*.csproj ./MiCompuEdu.Infrastructure/
COPY backend/MiCompuEdu.WebApi/*.csproj ./MiCompuEdu.WebApi/

# Restore dependencies
RUN dotnet restore MiCompuEdu.WebApi/MiCompuEdu.WebApi.csproj

# Copy remaining source code
COPY backend/MiCompuEdu.Domain/ ./MiCompuEdu.Domain/
COPY backend/MiCompuEdu.Application/ ./MiCompuEdu.Application/
COPY backend/MiCompuEdu.Infrastructure/ ./MiCompuEdu.Infrastructure/
COPY backend/MiCompuEdu.WebApi/ ./MiCompuEdu.WebApi/

# Publish Release build
RUN dotnet publish MiCompuEdu.WebApi/MiCompuEdu.WebApi.csproj -c Release -o out

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build-env /app/out .

# Expose default ASP.NET Core port
EXPOSE 8080

ENTRYPOINT ["dotnet", "MiCompuEdu.WebApi.dll"]
