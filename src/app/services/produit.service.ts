import { Injectable, inject } from '@angular/core';
import { Produit } from '@shared/models/produit.model';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProduitService {

  private readonly http = inject(HttpClient);

  // Toutes les requêtes passent par le gateway (environment.apiUrl) :
  // c'est la condition pour que l'interceptor attache le token Keycloak.
  private readonly apiURL = `${environment.apiUrl}/produits/api/all`;

  listeProduit(): Observable<Produit[]> {
    return this.http.get<Produit[]>(this.apiURL);
  }
}
