'use client';

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

  async function onSubmit(payload: SignUpSchema) {
    // Mapear para campos aceitos pela rota (/api/geocode) -> cidade, rua, numero, codigoPostal, pais
    const body = {
      cidade: payload.cidade,
      rua: payload.rua,
      numero: payload.numero,
      codigoPostal: payload.cep,
      pais: payload.pais,
      // estado mantido apenas se quiser usar depois, a API atual não o consome separadamente
      estado: payload.estado,
    };
    
    const dataForm = {
      date: payload.date,
      hour: payload.hour
    }

    sessionStorage.setItem("eventDateData", JSON.stringify(dataForm));

    const result = await fetch("/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!result.ok) {
      console.error("Erro ao enviar dados:", result.statusText);
      return;
    }
    const json = await result.json();
    sessionStorage.setItem("locationData", JSON.stringify(json));
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
    <p className="text-2xl">Will the weather cooperate with your event???</p>
    <h1 className="text-4xl font-bold">Find out with Accurate Forecast</h1>
  </div>
</div>

      {/* Animated and centered form */}
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
              Enter your event location and find out if the weather will cooperate or not.
            </p>
          </div>
          <div>
            <input
              placeholder="Enter the city name" {...register("cidade")}
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors?.cidade && <p className="text-red-500 text-sm mt-1">{errors?.cidade?.message}</p>}
          </div>
          <div>
            <input
              placeholder="Enter the street" {...register("rua")}
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors?.rua && <p className="text-red-500 text-sm mt-1">{errors?.rua?.message}</p>}
          </div>
          <div>
            <input
              placeholder="Enter the state" {...register("estado")}
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors?.estado && <p className="text-red-500 text-sm mt-1">{errors?.estado?.message}</p>}
          </div>
          <div>
            <input
              placeholder="Enter the country" {...register("pais")}
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors?.pais && <p className="text-red-500 text-sm mt-1">{errors?.pais?.message}</p>}
          </div>
          <div>
            <input
              placeholder="Enter the number" {...register("numero")}
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors?.numero && <p className="text-red-500 text-sm mt-1">{errors?.numero?.message}</p>}
          </div>
          <div>
            <input
              placeholder="Enter the ZIP code" {...register("cep")}
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors?.cep && <p className="text-red-500 text-sm mt-1">{errors?.cep?.message}</p>}
          </div>
          <div>
            <input
              type="date"
              placeholder="Event date" {...register("date")}
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors?.date && <p className="text-red-500 text-sm mt-1">{errors?.date?.message}</p>}
          </div>
          <div>
            <input
              type="time"
              placeholder="Event time" {...register("hour")}
              className="border border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors?.hour && <p className="text-red-500 text-sm mt-1">{errors?.hour?.message}</p>}
          </div>
          <div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            >
              Check
            </button>
          </div>
        </form>
      </div>

    </div>
  );

}