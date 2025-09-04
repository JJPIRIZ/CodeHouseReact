import CartWidget from "./CartWidget";

export default function NavBar() {
    return (
        <>
            <nav>
                <h1>Mastecno</h1>
                <ul>
                    <li><a href="#">Productos</a></li>
                    <li><a href="#">Nosotros</a></li>
                    <li><a href="#">Contacto</a></li>
                </ul>   
                <CartWidget />
            </nav>
        </>
    )
}