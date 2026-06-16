using System;
using System.Linq;
using System.Text;
using MiCompuEdu.Application.Common.Interfaces;
using MiCompuEdu.Application.Reparaciones.Commands;
using MiCompuEdu.Domain.Entities;
using MiCompuEdu.Domain.Enums;
using MiCompuEdu.Infrastructure.Persistence;
using MiCompuEdu.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "MiCompuEdu Web API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrEmpty(connectionString))
{
    connectionString = "Host=localhost;Database=micompuedu_db;Username=postgres;Password=postgres";
}

// Usar Npgsql. Si hay problemas conectando, en runtime controlamos la falla
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString, b => b.MigrationsAssembly("MiCompuEdu.Infrastructure")));

builder.Services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(RegistrarIngresoCommand).Assembly));

builder.Services.AddScoped<IWhatsAppService, WhatsAppService>();
builder.Services.AddScoped<IPdfGeneratorService, PdfGeneratorService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var jwtKey = builder.Configuration["Jwt:Key"] ?? "ClaveSecretaSuperSeguraParaSanJuanDeAlMenos32Caracteres!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "MiCompuEdu_Issuer";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "MiCompuEdu_Audience";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Seeding DB on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        context.Database.EnsureCreated();

        if (!context.Usuarios.Any())
        {
            context.Usuarios.AddRange(
                new Usuario
                {
                    Id = Guid.NewGuid(),
                    NombreCompleto = "Administrador del Sistema",
                    NombreUsuario = "admin",
                    Email = "admin.micompuedu@sanjuan.edu.ar",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                    Rol = UserRole.Administrador,
                    Activo = true
                },
                new Usuario
                {
                    Id = Guid.NewGuid(),
                    NombreCompleto = "Supervisor de Depósito",
                    NombreUsuario = "supervisor",
                    Email = "supervisor.micompuedu@sanjuan.edu.ar",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                    Rol = UserRole.Supervisor,
                    Activo = true
                },
                new Usuario
                {
                    Id = Guid.NewGuid(),
                    NombreCompleto = "Técnico Reparador Alfa",
                    NombreUsuario = "tecnico",
                    Email = "tecnico1.micompuedu@sanjuan.edu.ar",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                    Rol = UserRole.Tecnico,
                    Activo = true
                },
                new Usuario
                {
                    Id = Guid.NewGuid(),
                    NombreCompleto = "Operador de Recepción Uno",
                    NombreUsuario = "operador",
                    Email = "operador1.micompuedu@sanjuan.edu.ar",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                    Rol = UserRole.Operador,
                    Activo = true
                }
            );
            context.SaveChanges();
        }

        if (!context.FallasCatalogo.Any())
        {
            context.FallasCatalogo.AddRange(
                new FallaCatalogo { Nombre = "No Enciende", Descripcion = "El equipo no responde al botón de encendido." },
                new FallaCatalogo { Nombre = "Pantalla Rota / Sin Imagen", Descripcion = "La pantalla LCD tiene fisuras físicas." },
                new FallaCatalogo { Nombre = "Bloqueo de Seguridad Juana Manso", Descripcion = "Pantalla de bloqueo roja/azul de seguridad." },
                new FallaCatalogo { Nombre = "Falla de Teclado", Descripcion = "Faltan teclas, están trabadas o varios caracteres no se digitan." },
                new FallaCatalogo { Nombre = "Problemas de Sistema Operativo", Descripcion = "El sistema operativo no inicia." }
            );
            context.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error al sembrar base de datos: {ex.Message}");
    }
}

app.Run();
