import Head from "next/head"
import styles from "../styles/Home.module.css"

import Header from "../components/Header"
import LotteryEntrance from "../components/LotteryEntrance"

export default function Home() {
    return (
        <div className={styles.container}>
            <Head>
                <title>Ethereum Lottery</title>
                <meta name="description" content="Ethereum Lottery" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Header />
            <LotteryEntrance />
        </div>
    )
}
