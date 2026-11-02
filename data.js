const STRAPI_URL = "https://strapi-production-4f4b.up.railway.app";

export async function fetchMonthlyMetrics() {
  const pageSize = 100;
  const records = [];
  let pageCount = 1;

  for (let page = 1; page <= pageCount; page += 1) {
    const response = await fetch(
      `${STRAPI_URL}/api/soberania-energeticas?pagination[page]=${page}&pagination[pageSize]=${pageSize}&sort[0]=fecha:desc`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`Error consultando Strapi: ${response.status}`);
    }

    const result = await response.json();

    if (!Array.isArray(result.data) || !Number.isInteger(result.meta?.pagination?.pageCount)) {
      throw new Error("Strapi devolvió una respuesta de métricas inválida.");
    }

    records.push(...result.data);
    pageCount = result.meta.pagination.pageCount;
  }

  const now = new Date();
  const periods = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    return {
      key,
      month: date.toLocaleDateString("es-AR", { month: "long" }),
      year: date.getFullYear(),
      energy: 0,
      savings: 0,
    };
  });
  const periodByKey = new Map(periods.map((period) => [period.key, period]));

  records.forEach((item) => {
    const dateMatch = typeof item.fecha === "string"
      ? /^(\d{4})-(\d{2})-(\d{2})/.exec(item.fecha)
      : null;

    if (!dateMatch) {
      throw new Error("Strapi devolvió un registro sin una fecha válida.");
    }

    const recordDate = new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T00:00:00Z`);
    if (Number.isNaN(recordDate.getTime()) || recordDate.toISOString().slice(0, 10) !== dateMatch[0]) {
      throw new Error(`Strapi devolvió una fecha inválida: ${item.fecha}.`);
    }

    const period = periodByKey.get(`${dateMatch[1]}-${dateMatch[2]}`);
    if (!period) return;

    const energy = item.energia_ahorrada_kwh == null ? 0 : Number(item.energia_ahorrada_kwh);
    const savings = item.ahorro_pesos == null ? 0 : Number(item.ahorro_pesos);

    if (!Number.isFinite(energy) || !Number.isFinite(savings)) {
      throw new Error(`Strapi devolvió valores inválidos para ${item.fecha}.`);
    }

    period.energy += energy;
    period.savings += savings;
  });

  return periods;
}

export const energyPoints = [
  {
    name: "Punto Digital",
    image: "./assets/images/punto-digital.webp",
    address: "Avenida Intendente Rubén D. Rivara y 9 de Julio",
    description: "Es un programa de inclusión digital, que ofrece espacios públicos donde la comunidad puede tener acceso a las nuevas tecnologías de información. Espacio libre y gratuito.",
    link: "https://www.instagram.com/puntodigitalalberti/",
  },
  {
    name: "Planta de Residuos Solidos Urbanos",
    image: "./assets/images/residuos-urbanos.webp",
    address: "EcoPlan Alberti",
    description: "Instalación destinada a la gestión y tratamiento de los residuos sólidos urbanos generados en la localidad, con el objetivo de minimizar su impacto ambiental y promover prácticas sostenibles.",
    link: "https://www.instagram.com/ecoplan.alberti/",
  },
  {
    name: "Hospital Municipal Nuestra Señora de La Merced",
    image: "./assets/images/hospital.webp",
    address: "José Inocencio Arias 306-348",
    description: "Centro de salud público que brinda atención médica integral a la comunidad, con servicios que incluyen emergencias, consultas externas y programas de salud preventiva.",
    link: "https://www.instagram.com/municipalidaddealberti/",
  },
  {
    name: "Municipalidad de Alberti",
    image: "./assets/images/municipalidad.webp",
    address: "Leandro N. Alem Y 9 de Julio",
    description: "Edificio municipal, obra del arquitecto Francisco Salamone inaugurado en 1938. La obra es un ejemplo de arquitectura racionalista",
    link: "https://www.instagram.com/municipalidaddealberti/",
  },
  {
    name: "SUM",
    image: "./assets/images/sum.webp",
    address: "Sector Industrial Planificado N°2",
    description: "Edificio municipal, obra del arquitecto Francisco Salamone inaugurado en 1938. La obra es un ejemplo de arquitectura racionalista",
    link: "https://www.instagram.com/municipalidaddealberti/",
  },
];
