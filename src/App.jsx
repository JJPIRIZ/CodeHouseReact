import NavBar from "./components/NavBar/NavBar";
import ItemListContainer from "./components/ItemListContainer/ItemListContainer";
import "./App.css";

export default function App() {
  return (
    <>
      <NavBar />
      <main className="page">
        <ItemListContainer greeting="¡Bienvenido a Mastecno!" />
      </main>
    </>
  );
}
