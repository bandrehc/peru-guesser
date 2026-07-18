import { redirect } from "next/navigation";
import GameScreen, {
  type PlayableLevel,
  type PlayableMode,
} from "@/components/game/GameScreen";

const NIVELES_DISPONIBLES = new Set<PlayableLevel>(["departamentos", "provincias"]);
const MODOS_DISPONIBLES = new Set<PlayableMode>(["pin", "escribir"]);

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ nivel?: string; modo?: string }>;
}) {
  const { nivel = "departamentos", modo = "pin" } = await searchParams;

  // El nivel distrital y el modo fotográfico aún no están implementados
  if (
    !NIVELES_DISPONIBLES.has(nivel as PlayableLevel) ||
    !MODOS_DISPONIBLES.has(modo as PlayableMode)
  ) {
    redirect("/");
  }

  return <GameScreen nivel={nivel as PlayableLevel} modo={modo as PlayableMode} />;
}
