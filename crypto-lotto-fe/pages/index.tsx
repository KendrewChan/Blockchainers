import * as React from 'react';

import Head from "next/head";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import 'react-tabs/style/react-tabs.css'

import Header from "../components/Header"
import PredictionGameEntrance from "../components/PredictionEntrance";
import LotteryEntrance from "../components/LotteryEntrance"


export function PredictionGame() {
    return (
        <div>
            <Head>
                <title>Crypto Flip</title>
                <link rel="icon" href="/favicon.ico"/>
            </Head>
            <Header/>
            <PredictionGameEntrance/>
        </div>
    )
}


export function Lottery() {
    return (
        <div>
            <Head>
                <title>Ethereum Lottery</title>
                <meta name="description" content="Ethereum Lottery"/>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Header/>
            <LotteryEntrance/>
        </div>
    )
}



export default function Home() {
    return (
        <Tabs>
            <TabList>
                <Tab>Ethereum Lottery</Tab>
                <Tab>Crypto Flip</Tab>
            </TabList>
            <TabPanel>
                <Lottery/>
            </TabPanel>
            <TabPanel>
                <PredictionGame/>
            </TabPanel>
        </Tabs>
    );
}


// export default function Home() {
//     return (
//         <div>
//             <Head>
//                 <title>Ethereum Lottery</title>
//                 <meta name="description" content="Ethereum Lottery"/>
//                 <link rel="icon" href="/favicon.ico" />
//             </Head>
//             <Header/>
//             <LotteryEntrance/>
//         </div>
//     );
// }
