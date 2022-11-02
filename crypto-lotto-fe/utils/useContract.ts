import { useWeb3Contract } from "react-moralis"

type UseContractParams<U> = Parameters<typeof useWeb3Contract>[0] & {
    defaultValue: U
}

type UseContractReturnType<T, U> = ReturnType<typeof useWeb3Contract> & {
    data: T | U
}

export default function useContract<
    T,
    U = T
>({ defaultValue, ...params }: UseContractParams<U>) {
    const { data, ...rest } = useWeb3Contract(params)

    return {
        data,
        ...rest,
    } as UseContractReturnType<T, U>
}
