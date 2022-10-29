import { Html, Head, Main, NextScript } from "next/document"

export default function MyDocument() {
    return (
        <Html className="h-full">
            <Head />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link
                href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
                rel="stylesheet"
            />
            <body className="h-full">
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}
