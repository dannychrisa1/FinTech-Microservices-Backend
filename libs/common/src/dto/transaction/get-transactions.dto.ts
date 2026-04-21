export class GetTransactionsDto {
    page?:number;
    limit?:number;
    type?:'DEPOSIT' | 'WITHDRAW' | 'TRANSFER';
    startDate?: string;
    endDate?:string;
}