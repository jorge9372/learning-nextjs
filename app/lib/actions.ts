"use server";
import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

//marcar que todas las funciones que se exportan en este archivo sonde servidor, por lo tanto no se ejecuta ni se envian al cliente

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

//aca estamos creando un sub esquema omitiendo los campos que no usamos
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  //transformamos para evitar errores de redondeo
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  //Otra manera desestructurando el array
  //   const [date] = new Date().toISOString().split("T");

  //Esta otra manera funciona mejor cuando son muchos campos
  //const rawFormData = Object.fromEntries(formData.entries());

  //test it out
  console.log({
    customerId,
    amount,
    status,
    date,
  });

  await sql`
  INSERT INTO invoices (customer_id, amount, status, date)
  VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;

  // Indica que la ruta debe ser revalidada para reflejar los cambios al momento de la creación de un nuevo invoice, actualiza el cache para evitar que se cachen los datos
  revalidatePath("/dashboard/invoices");
  //Aca redireccionamos usando next/navigation para mostrar los cambios de inmediato
  redirect("/dashboard/invoices");
}
