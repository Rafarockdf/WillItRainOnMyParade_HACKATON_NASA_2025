'use client';

import Image from "next/image";
import { useForm } from "react-hook-form";
import { SignUpSchema, signUpSchema } from "./_schemas/auth-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { CloudRain } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema)
  });

  function onSubmit(payload: SignUpSchema) {
    console.log("enviado", payload);
    router.push("/forecast");
  }

  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 10) {
        setShowForm(true);
      } else {
        setShowForm(false);
      }
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-8 pb-20">
<div
  className={`absolute left-1/2 top-1/4 transform -translate-x-1/2 -translate-y-1/2
    transition-all duration-700 ease-in-out
    ${showForm
      ? "opacity-0 -translate-y-8 pointer-events-none"
      : "opacity-100 translate-y-0"
    }
  `}
  style={{ width: "100%", zIndex: 10 }}
>
  <div className="text-center space-y-4 justify-items-center transition-opacity duration-700 ease-in-out">
    <CloudRain className="h-20 w-20 text-[var(--foreground)] mx-auto" aria-hidden="true" />
    <p className="text-2xl">O tempo vai colaborar com seu evento ???</p>
    <h1 className="text-4xl font-bold">Descubra com a Previsão Certa</h1>
  </div>
</div>

      {/* Formulário animado e centralizado */}
      <div
        className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-in-out
          ${showForm
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
          }`}
        style={{ width: "100%", zIndex: 20 }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-96 mx-auto">
          <div>
            <p className="max-w-xl text-[var(--foreground)]  mx-auto font-bold text-center">
              Informe o local do seu evento e descubra se o clima vai colaborar ou não.
            </p>
          </div>
          <div>
            <input
              placeholder="Digite o nome da cidade" {...register("cidade")}
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors?.cidade && <p className="text-red-500 text-sm mt-1">{errors?.cidade?.message}</p>}
          </div>
          <div>
            <input
              placeholder="Digite a rua" {...register("rua")}
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors?.rua && <p className="text-red-500 text-sm mt-1">{errors?.rua?.message}</p>}
          </div>
          <div>
            <input
              placeholder="Digite o estado" {...register("estado")}
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors?.estado && <p className="text-red-500 text-sm mt-1">{errors?.estado?.message}</p>}
          </div>
          <div>
            <input
              placeholder="Digite o número" {...register("numero")}
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors?.numero && <p className="text-red-500 text-sm mt-1">{errors?.numero?.message}</p>}
          </div>
          <div>
            <input
              placeholder="Digite o CEP" {...register("cep")}
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors?.cep && <p className="text-red-500 text-sm mt-1">{errors?.cep?.message}</p>}
          </div>
          <div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            >
              Verificar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}