import { z } from "zod";
export const PizzaSchema = z.object({
  name: z.string().trim().min(2, "Минимум 2 символа").max(60, "Максимум 60"),
  description: z.string().trim().max(1000, "До 1000 символов").optional().or(z.literal("")),
  cost_price: z.coerce.number().min(0, "Не меньше 0").multipleOf(0.01, "2 знака после запятой"),
});
