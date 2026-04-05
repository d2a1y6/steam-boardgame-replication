import { GameSessionProvider } from "./providers/GameSessionProvider";
import { GamePage } from "../pages/game/GamePage";

export default function App() {
  return (
    <GameSessionProvider>
      <GamePage />
    </GameSessionProvider>
  );
}
