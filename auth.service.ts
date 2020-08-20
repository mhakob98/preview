import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { ServerResponse } from '../models/server-response';
import { AuthState } from '../models/auth';
import { map, catchError, filter } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User, InstagramAccount } from '../models/user';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private _userInfo: User;
    private _userInfoState$: BehaviorSubject<User> = new BehaviorSubject<User>(null);
    private _isAuthorized: boolean = false;
    private _isAuthorizedState$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private _activeAccountState$ = new BehaviorSubject<any>(null)
    private _activeAccount: InstagramAccount = {} as InstagramAccount;

    constructor(
        private _httpClient: HttpClient,
        private _router: Router,
    ) { }

    private _saveActiveAccount(accountId: number): Observable<{}> {
        return this._httpClient.post<{}>('instagram/switch-account', { accountId: accountId });
    }

    public setUserState(userInfo): void {
        this._userInfo = userInfo;
        this._userInfoState$.next(this._userInfo);
    }

    public setAccount(account: InstagramAccount): void {
        this._activeAccount = account;
        this._activeAccountState$.next(this._activeAccount);
        if (account && account.id) {
            this._saveActiveAccount(account.id).subscribe();
        }
    }

    public getAccount(): InstagramAccount {
        return this._activeAccount;
    }

    public getUserStateSync(): User {
        return this._userInfo;
    }

    public getUserState(): Observable<User> {
        return this._userInfoState$.asObservable().pipe(
            filter((user) => user != null)
        );
    }

    public setAuthState(isAuthorized: boolean): void {
        this._isAuthorized = isAuthorized;
    }

    public getAuthStateSync(): boolean {
        return this._isAuthorized;
    }

    public getAuthState(): Observable<boolean> {
        return this._isAuthorizedState$.asObservable();
    }

    public getActiveAccount(): Observable<InstagramAccount> {
        return this._activeAccountState$.asObservable();
    }

    public checkAuthState(): Observable<boolean> {
        let headers = new HttpHeaders();
        headers = headers.append('Cache-Control', 'no-cache, no-store, must-revalidate, post-check=0, pre-check=0');
        headers = headers.append('Pragma', 'no-cache');
        headers = headers.append('Expires', '0');
        return this._httpClient.get<ServerResponse<AuthState>>('check-token', { headers })
            .pipe(
                map((response) => {

                    this.setAuthState(true);
                    return true;
                }),
                catchError((err) => {
                    this.setAuthState(false);
                    this._router.navigate(['/auth/login']);
                    return throwError(false);
                })
            )
    }

}