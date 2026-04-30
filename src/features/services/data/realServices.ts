export type RealService = {
  name: string;
  description: string;
};

export type RealServiceCategory = {
  id: string;
  name: string;
  description: string;
  services: RealService[];
};

export const REAL_SERVICE_CATEGORIES: RealServiceCategory[] = [
  {
    id: "facial",
    name: "Facial",
    description:
      "Protocolos faciales profesionales orientados a limpieza, renovación, hidratación y mejora visual de la piel.",
    services: [
      {
        name: "Limpieza Premium",
        description:
          "Tratamiento facial profundo diseñado para limpiar, descongestionar e hidratar la piel, dejando el rostro más luminoso, fresco y equilibrado.",
      },
      {
        name: "Limpieza Deluxe",
        description:
          "Experiencia facial completa enfocada en limpieza profunda, renovación e hidratación intensiva, ideal para pieles que necesitan un cuidado más avanzado.",
      },
      {
        name: "Limpieza Facial Gym",
        description:
          "Tratamiento facial revitalizante que estimula la piel mediante técnicas activas, ayudando a mejorar la tonicidad, oxigenación y apariencia del rostro.",
      },
      {
        name: "Limpieza Dermaplaning",
        description:
          "Exfoliación facial con técnica dermaplaning que retira células muertas y vello superficial, dejando la piel más suave, luminosa y uniforme.",
      },
      {
        name: "Limpieza Pro",
        description:
          "Limpieza facial profesional enfocada en purificar, equilibrar y mejorar la textura de la piel mediante un protocolo personalizado.",
      },
      {
        name: "Limpieza Embarazada/Lactante",
        description:
          "Limpieza facial segura y adaptada para embarazadas o mujeres en periodo de lactancia, usando productos y técnicas adecuados para esta etapa.",
      },
      {
        name: "Peeling Químico Facial/Corporal",
        description:
          "Tratamiento de renovación cutánea que ayuda a mejorar textura, manchas, marcas, luminosidad y apariencia general de la piel.",
      },
      {
        name: "Microneedling",
        description:
          "Técnica de bioestimulación con microagujas que favorece la regeneración de la piel, mejora textura, marcas, poros y luminosidad.",
      },
      {
        name: "Hydralips",
        description:
          "Tratamiento hidratante para labios que ayuda a mejorar suavidad, apariencia y sensación de hidratación profunda.",
      },
    ],
  },
  {
    id: "corporal",
    name: "Corporal",
    description:
      "Tratamientos corporales enfocados en bienestar, drenaje, modelación estética y cuidado de zonas específicas.",
    services: [
      {
        name: "Masaje Relajante y Descontracturante",
        description:
          "Masaje corporal orientado a liberar tensión muscular, reducir estrés y entregar una sensación profunda de descanso y bienestar.",
      },
      {
        name: "Masajes Reductivos y Reafirmantes",
        description:
          "Tratamiento corporal enfocado en modelar, activar la circulación y mejorar la firmeza de zonas específicas del cuerpo.",
      },
      {
        name: "Drenaje Linfático Corporal",
        description:
          "Técnica suave y especializada que ayuda a estimular el sistema linfático, reducir retención de líquidos y mejorar la sensación de liviandad.",
      },
      {
        name: "Post Operatorios",
        description:
          "Tratamiento de apoyo estético posterior a procedimientos, orientado a favorecer la recuperación, disminuir inflamación y mejorar el bienestar corporal.",
      },
      {
        name: "Tratamiento Anticelulítico",
        description:
          "Protocolo corporal enfocado en mejorar la apariencia de la piel con celulitis, estimular circulación y trabajar zonas localizadas.",
      },
      {
        name: "Levantamiento de Glúteos",
        description:
          "Tratamiento corporal diseñado para mejorar la apariencia, tonicidad y firmeza de la zona glútea mediante técnicas estéticas no invasivas.",
      },
    ],
  },
  {
    id: "lash-brows",
    name: "Lash & Brows",
    description:
      "Servicios para realzar mirada y cejas con definición, orden y cuidado estético personalizado.",
    services: [
      {
        name: "Lifting de Pestañas",
        description:
          "Tratamiento que eleva y curva las pestañas naturales, logrando una mirada más abierta, definida y elegante.",
      },
      {
        name: "HidraBrow",
        description:
          "Tratamiento para cejas enfocado en hidratación, definición y cuidado del vello, logrando un acabado más prolijo y saludable.",
      },
      {
        name: "Laminado de Cejas",
        description:
          "Técnica que ordena, fija y define las cejas para darles una apariencia más peinada, tupida y armónica.",
      },
      {
        name: "Visagismo y Perfilado de Cejas",
        description:
          "Diseño personalizado de cejas según facciones, forma del rostro y estilo de cada persona.",
      },
    ],
  },
  {
    id: "fibroblast",
    name: "Fibroblast",
    description:
      "Procedimientos estéticos localizados orientados a mejorar apariencia, textura y firmeza de la piel previa evaluación.",
    services: [
      {
        name: "Zona Ocular",
        description:
          "Tratamiento estético no quirúrgico enfocado en mejorar la apariencia de la piel alrededor de los ojos.",
      },
      {
        name: "Rostro",
        description:
          "Procedimiento de fibroblast orientado a mejorar firmeza, textura y apariencia general de la piel facial.",
      },
      {
        name: "Papada",
        description:
          "Tratamiento localizado para mejorar la apariencia de la zona submentoniana y aportar mayor definición visual.",
      },
      {
        name: "Escote",
        description:
          "Tratamiento enfocado en mejorar textura, firmeza y apariencia de la piel del escote.",
      },
      {
        name: "Abdomen",
        description:
          "Procedimiento localizado para mejorar apariencia y firmeza de la piel abdominal.",
      },
      {
        name: "Estrías",
        description:
          "Tratamiento orientado a mejorar la apariencia visible de estrías mediante técnica estética localizada.",
      },
      {
        name: "Acrocordones",
        description:
          "Procedimiento estético para tratar pequeñas lesiones benignas superficiales de la piel, previa evaluación profesional.",
      },
    ],
  },
  {
    id: "camuflajes",
    name: "Camuflajes",
    description:
      "Técnicas especializadas de restauración y camuflaje estético para unificar visualmente el tono de la piel.",
    services: [
      {
        name: "Restauración de Estrías",
        description:
          "Tratamiento estético especializado que busca mejorar visualmente la apariencia de estrías mediante técnicas de restauración.",
      },
      {
        name: "Camuflaje de Estrías",
        description:
          "Técnica estética orientada a unificar el tono de la piel y disminuir visualmente el contraste de las estrías.",
      },
      {
        name: "Camuflaje de Cicatrices",
        description:
          "Procedimiento especializado para mejorar visualmente cicatrices mediante técnicas de camuflaje estético.",
      },
    ],
  },
];
