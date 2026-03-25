export class GetTransactionsDto {
    accountNumber: string;
    page?:number;
    limit?:number;
    type?:'DEPOSIT' | 'WITHDRAW' | 'TRANSFER';
    startDate?: string;
    endDate?:string;
}