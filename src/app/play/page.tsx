import { redirect } from "next/navigation";
import GameScreen, {
  type PlayableLevel,
  type PlayableMode,
} from "@/components/game/GameScreen";
import { DEPARTAMENTOS } from "@/lib/departamentos";

const NIVELES_DISPONIBLES = new Set<PlayableLevel>([
  "departamentos",
  "provincias",
  "distritos",
]);
const MODOS_DISPONIBLES = new Set<PlayableMode>(["pin", "escribir"]);

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ nivel?: string; modo?: string; dep?: string }>;
}) {
  const { nivel = "departamentos", modo = "pin", dep } = await searchParams;

  // El modo fotográfico aún no está implementado
  if (
    !NIVELES_DISPONIBLES.has(nivel as PlayableLevel) ||
    !MODOS_DISPONIBLES.has(modo as PlayableMode)
  ) {
    redirect("/");
  }

  // El nivel distrital se juega por departamento
  if (nivel === "distritos" && !DEPARTAMENTOS.some((d) => d.id === dep)) {
    redirect("/");
  }

  return (
    <GameScreen
      nivel={nivel as PlayableLevel}
      modo={modo as PlayableMode}
      dep={dep}
    />
  );
}
