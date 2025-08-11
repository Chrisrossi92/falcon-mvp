import { useParams } from "react-router-dom";
import { invariant } from "@/lib/assert";

export function useParam(name: string): string {
  const params = useParams();
  const value = (params as Record<string, string | undefined>)[name];
  invariant(value, `Missing route param: ${name}`);
  return value;
}
