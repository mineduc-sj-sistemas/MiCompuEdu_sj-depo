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
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

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

var rawConnectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrEmpty(rawConnectionString))
{
    rawConnectionString = "Host=localhost;Database=micompuedu_db;Username=postgres;Password=postgres";
}

string connectionString = rawConnectionString;
if (rawConnectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
    rawConnectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
{
    var dbUri = new Uri(rawConnectionString);
    var userInfo = dbUri.UserInfo.Split(':', 2);
    var dbPort = dbUri.Port > 0 ? dbUri.Port : 5432;
    connectionString = $"Host={dbUri.Host};Port={dbPort};Database={dbUri.AbsolutePath.TrimStart('/')};Username={Uri.UnescapeDataString(userInfo[0])};Password={Uri.UnescapeDataString(userInfo.Length > 1 ? userInfo[1] : "")};SSL Mode=Prefer;Trust Server Certificate=true";
}

// Usar Npgsql. Si hay problemas conectando, en runtime controlamos la falla
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString, b => b.MigrationsAssembly("MiCompuEdu.Infrastructure")));

builder.Services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(RegistrarIngresoCommand).Assembly));

builder.Services.AddScoped<IWhatsAppService, WhatsAppService>();
builder.Services.AddScoped<IPdfGeneratorService, PdfGeneratorService>();
builder.Services.AddHostedService<NotificationWorkerService>();
builder.Services.AddSignalR();
builder.Services.AddScoped<ISignalRService, SignalRService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
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
app.MapGet("/api/v1/health", () => "Healthy").AllowAnonymous();
app.MapHub<MiCompuEdu.Infrastructure.Hubs.ReparacionHub>("/hubs/reparaciones");

// Seeding DB on startup with retry logic (robust Docker initialization)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var maxRetryAttempts = 10;
    var delayBetweenRetriesSeconds = 3;

    for (int attempt = 1; attempt <= maxRetryAttempts; attempt++)
    {
        try
        {
            var context = services.GetRequiredService<ApplicationDbContext>();
            context.Database.Migrate();

            context.Database.ExecuteSqlRaw(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reparaciones' AND column_name = 'PersonaEntregaTipo') THEN
                        ALTER TABLE reparaciones ADD COLUMN ""PersonaEntregaTipo"" VARCHAR(50);
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reparaciones' AND column_name = 'PersonaEntregaNombre') THEN
                        ALTER TABLE reparaciones ADD COLUMN ""PersonaEntregaNombre"" VARCHAR(200);
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reparaciones' AND column_name = 'PersonaEntregaDni') THEN
                        ALTER TABLE reparaciones ADD COLUMN ""PersonaEntregaDni"" VARCHAR(30);
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reparaciones' AND column_name = 'PersonaEntregaTelefono') THEN
                        ALTER TABLE reparaciones ADD COLUMN ""PersonaEntregaTelefono"" VARCHAR(50);
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reparaciones' AND column_name = 'PersonaEntregaParentesco') THEN
                        ALTER TABLE reparaciones ADD COLUMN ""PersonaEntregaParentesco"" VARCHAR(100);
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reparaciones' AND column_name = 'DocIdentidadIngresoUrl') THEN
                        ALTER TABLE reparaciones ADD COLUMN ""DocIdentidadIngresoUrl"" VARCHAR(500);
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reparaciones' AND column_name = 'PersonaRetiroTipo') THEN
                        ALTER TABLE reparaciones ADD COLUMN ""PersonaRetiroTipo"" VARCHAR(50);
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reparaciones' AND column_name = 'PersonaRetiroNombre') THEN
                        ALTER TABLE reparaciones ADD COLUMN ""PersonaRetiroNombre"" VARCHAR(200);
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reparaciones' AND column_name = 'PersonaRetiroDni') THEN
                        ALTER TABLE reparaciones ADD COLUMN ""PersonaRetiroDni"" VARCHAR(30);
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reparaciones' AND column_name = 'PersonaRetiroTelefono') THEN
                        ALTER TABLE reparaciones ADD COLUMN ""PersonaRetiroTelefono"" VARCHAR(50);
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reparaciones' AND column_name = 'PersonaRetiroParentesco') THEN
                        ALTER TABLE reparaciones ADD COLUMN ""PersonaRetiroParentesco"" VARCHAR(100);
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reparaciones' AND column_name = 'DocIdentidadEntregaUrl') THEN
                        ALTER TABLE reparaciones ADD COLUMN ""DocIdentidadEntregaUrl"" VARCHAR(500);
                    END IF;

                    UPDATE beneficiarios SET ""TipoBeneficiario"" = 1 WHERE ""TipoBeneficiario"" = 0;
                END $$;
            ");

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

            if (!context.Escuelas.Any())
            {
                context.Escuelas.AddRange(
                    new Escuela { Id = Guid.NewGuid(), Nombre = "Escuela Normal Superior Sarmiento", Activo = true },
                    new Escuela { Id = Guid.NewGuid(), Nombre = "Escuela EPET N° 1 Rogelio Boero", Activo = true },
                    new Escuela { Id = Guid.NewGuid(), Nombre = "Colegio Provincial de Concepción", Activo = true },
                    new Escuela { Id = Guid.NewGuid(), Nombre = "Colegio Nacional Monseñor Pablo Cabrera", Activo = true }
                );
                context.SaveChanges();
            }

            if (!context.UbicacionesDeposito.Any())
            {
                context.UbicacionesDeposito.AddRange(
                    new UbicacionDeposito { Id = Guid.NewGuid(), Estanteria = "Estantería A", Fila = 1, Posicion = 1, Codigo = "EST-A-F1-P1", Activo = true },
                    new UbicacionDeposito { Id = Guid.NewGuid(), Estanteria = "Estantería A", Fila = 1, Posicion = 2, Codigo = "EST-A-F1-P2", Activo = true },
                    new UbicacionDeposito { Id = Guid.NewGuid(), Estanteria = "Estantería A", Fila = 2, Posicion = 1, Codigo = "EST-A-F2-P1", Activo = true },
                    new UbicacionDeposito { Id = Guid.NewGuid(), Estanteria = "Estantería B", Fila = 1, Posicion = 1, Codigo = "EST-B-F1-P1", Activo = true },
                    new UbicacionDeposito { Id = Guid.NewGuid(), Estanteria = "Estantería B", Fila = 2, Posicion = 3, Codigo = "EST-B-F2-P3", Activo = true }
                );
                context.SaveChanges();
            }

            if (!context.ProgramasEducativos.Any())
            {
                context.ProgramasEducativos.AddRange(
                    new ProgramaEducativo { Id = Guid.NewGuid(), Nombre = "Conectar Igualdad", Descripcion = "Programa nacional de distribución de netbooks para educación secundaria.", Activo = true },
                    new ProgramaEducativo { Id = Guid.NewGuid(), Nombre = "Juana Manso", Descripcion = "Plan federal Juana Manso de conectividad y equipamiento escolar.", Activo = true },
                    new ProgramaEducativo { Id = Guid.NewGuid(), Nombre = "Maestros de América", Descripcion = "Programa Provincial Maestros de América.", Activo = true },
                    new ProgramaEducativo { Id = Guid.NewGuid(), Nombre = "HP Docentes/Directivos", Descripcion = "Programa de notebooks HP para personal docente y directivo de escuelas.", Activo = true }
                );
                context.SaveChanges();
            }

            // Desactivar programas que no deben mostrarse en Paso 1
            var programasInactivos = context.ProgramasEducativos
                .Where(p => p.Nombre == "San Juan Tec" || p.Nombre == "MiCompuEdu San Juan" || p.Nombre == "Dell Directivos" || p.Nombre == "Dell Docentes/Directivos")
                .ToList();
            foreach (var p in programasInactivos)
            {
                p.Activo = false;
            }

            // Asegurar Maestros de América
            var progMaestros = context.ProgramasEducativos.FirstOrDefault(p => p.Nombre == "Maestros de América" || p.Nombre == "Maestros de America");
            if (progMaestros == null)
            {
                context.ProgramasEducativos.Add(new ProgramaEducativo { Id = Guid.NewGuid(), Nombre = "Maestros de América", Descripcion = "Programa Provincial Maestros de América.", Activo = true });
            }
            else
            {
                progMaestros.Activo = true;
            }

            // Actualizar o crear HP Docentes/Directivos
            var progHp = context.ProgramasEducativos.FirstOrDefault(p => p.Nombre == "HP Directivos" || p.Nombre == "HP Docentes/Directivos");
            if (progHp == null)
            {
                context.ProgramasEducativos.Add(new ProgramaEducativo { Id = Guid.NewGuid(), Nombre = "HP Docentes/Directivos", Descripcion = "Programa de notebooks HP para personal docente y directivo de escuelas.", Activo = true });
            }
            else
            {
                progHp.Nombre = "HP Docentes/Directivos";
                progHp.Activo = true;
            }

            // Renombrar la falla del catálogo
            var fallaJuanaManso = context.FallasCatalogo.FirstOrDefault(f => f.Nombre == "Bloqueo de Seguridad Juana Manso");
            if (fallaJuanaManso != null)
            {
                fallaJuanaManso.Nombre = "Bloqueo de Seguridad";
            }
            context.SaveChanges();

            if (!context.Beneficiarios.Any())
            {
                var escuela = context.Escuelas.FirstOrDefault(e => e.Nombre == "Escuela Normal Superior Sarmiento");
                var programa = context.ProgramasEducativos.FirstOrDefault(p => p.Nombre == "Juana Manso");

                var beneficiarioId = Guid.NewGuid();
                var beneficiario = new Beneficiario
                {
                    Id = beneficiarioId,
                    Dni = "42345678",
                    Nombre = "Juan",
                    Apellido = "Pérez",
                    Telefono = "+542644123456",
                    Email = "juanperez@gmail.com",
                    EscuelaId = escuela?.Id
                };

                var equipo = new Equipo
                {
                    Id = Guid.NewGuid(),
                    NumeroSerie = "SERIE12345678X",
                    Marca = "Exo",
                    Modelo = "Juana Manso v2",
                    CredencialesOffice = "juan.perez.sj / passOffice2026",
                    BeneficiarioId = beneficiarioId,
                    ProgramaEducativoId = programa?.Id
                };

                context.Beneficiarios.Add(beneficiario);
                context.Equipos.Add(equipo);
                context.SaveChanges();
            }

            Console.WriteLine("Base de datos conectada e inicializada con éxito.");
            break;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Intento {attempt}/{maxRetryAttempts} de inicialización de BD falló: {ex.Message}");
            if (attempt == maxRetryAttempts)
            {
                Console.WriteLine("Se alcanzó el número máximo de intentos de conexión. Terminando.");
                throw;
            }
            System.Threading.Thread.Sleep(delayBetweenRetriesSeconds * 1000);
        }
    }
}

app.Run();
