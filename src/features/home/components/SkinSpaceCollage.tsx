import React from "react";
import workingLampImg from "@/assets/skinspace-working-lamp.jpeg";
import deviceImg from "@/assets/skinspace-device.jpeg";
import productsImg from "@/assets/skinspace-products.jpeg";
import glovesProfileImg from "@/assets/skinspace-gloves-profile.jpeg";

const collageImages = [
  {
    src: workingLampImg,
    alt: "Constanza trabajando bajo lámpara profesional",
    figureClassName: "lg:aspect-[1.18/1]",
    imageClassName: "object-contain object-center",
  },
  {
    src: deviceImg,
    alt: "Constanza sosteniendo un dispositivo profesional de skincare",
    figureClassName: "lg:aspect-[0.78/1]",
    imageClassName: "object-contain object-center",
  },
  {
    src: productsImg,
    alt: "Productos skincare profesionales en bandeja clínica",
    figureClassName: "lg:aspect-[1.08/1]",
    imageClassName: "object-contain object-center",
  },
  {
    src: glovesProfileImg,
    alt: "Constanza con guantes en perfil lateral",
    figureClassName: "lg:aspect-[1/1]",
    imageClassName: "object-contain object-center",
  },
];

export const SkinSpaceCollage: React.FC = () => {
  return (
    <section className="w-full bg-[var(--muted)]">
      <div className="mx-auto w-[92%] max-w-6xl py-16 sm:py-20 2xl:w-[80%] 2xl:max-w-none">
        <div className="mx-auto max-w-3xl text-center">
          <p className="premium-kicker">Experiencia CQUEZADASKIN</p>
          <h2 className="premium-heading mt-3 text-4xl font-semibold leading-none text-[#3b302c] sm:text-5xl">
            Un espacio pensado para tu piel
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#6d554b] sm:text-lg">
            Tratamientos personalizados, atención cercana y resultados visibles
            en un ambiente profesional.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
          {collageImages.map((image) => (
            <figure
              key={image.alt}
              className={[
                "group flex min-h-[22rem] overflow-hidden rounded-[1.25rem] border border-white/75 bg-[#f8f2ee] shadow-[0_22px_70px_rgba(80,55,45,0.12)] sm:min-h-[28rem] lg:min-h-0",
                image.figureClassName,
              ].join(" ")}
            >
              <img
                src={image.src}
                alt={image.alt}
                className={[
                  "h-full w-full transition duration-500 group-hover:scale-[1.01]",
                  image.imageClassName,
                ].join(" ")}
                loading="lazy"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkinSpaceCollage;
