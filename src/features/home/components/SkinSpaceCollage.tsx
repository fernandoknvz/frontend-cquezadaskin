import React from "react";
import relajanteImg from "@/assets/services/relajante.jpg";
import constanzaImg from "@/assets/oficial_ceo.jpeg";

const studioImg = "/img/oficial_hero.jpeg";

const collageImages = [
  {
    src: studioImg,
    alt: "Cabina de estética preparada para tratamientos faciales",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    src: "/img/oficial_hero.jpeg",
    alt: "Constanza Quezada preparando un tratamiento",
    className: "",
  },
  {
    src: relajanteImg,
    alt: "Tratamiento corporal en ambiente profesional",
    className: "",
  },
  {
    src: constanzaImg,
    alt: "Retrato profesional de Constanza Quezada",
    className: "md:col-span-2",
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

        <div className="mt-10 grid auto-rows-[15rem] grid-cols-1 gap-4 sm:auto-rows-[18rem] md:grid-cols-4">
          {collageImages.map((image) => (
            <figure
              key={image.alt}
              className={[
                "group overflow-hidden rounded-[1.25rem] border border-white/70 bg-white shadow-[0_22px_70px_rgba(80,55,45,0.12)]",
                image.className,
              ].join(" ")}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]"
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
