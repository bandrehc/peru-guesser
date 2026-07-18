import { redirect } from "next/navigation";
import GameScreen, {
  type PlayableLevel,
  type PlayableMode,
} from "@/components/game/GameScreen";
import PhotoGameScreen from "@/components/game/PhotoGameScreen";
import { DEPARTAMENTOS } from "@/lib/departamentos";

const NIVELES_DISPONIBLES = new Set<PlayableLevel>([
  "departamentos",
  "provincias",
  "distritos",
]);
const MODOS_DISPONIBLES = new Set<string>(["pin", "escribir", "foto"]);

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ nivel?: string; modo?: string; dep?: string }>;
}) {
  const { nivel = "departamentos", modo = "pin", dep } = await searchParams;

  if (
    !NIVELES_DISPONIBLES.has(nivel as PlayableLevel) ||
    !MODOS_DISPONIBLES.has(modo)
  ) {
    redirect("/");
  }

  // El modo fotográfico solo existe a nivel departamental en esta fase
  if (modo === "foto") {
    if (nivel !== "departamentos") redirect("/");
    return <PhotoGameScreen />;
  }

  const depValido = DEPARTAMENTOS.some((d) => d.id === dep);

  // El nivel distrital se juega por departamento
  if (nivel === "distritos" && !depValido) redirect("/");

  // En provincias, dep es opcional (alcance local); si viene, debe ser válido
  if (nivel === "provincias" && dep !== undefined && !depValido) redirect("/");

  return (
    <GameScreen
      nivel={nivel as PlayableLevel}
      modo={modo as PlayableMode}
      dep={nivel === "departamentos" ? undefined : dep}
    />
  );
}
