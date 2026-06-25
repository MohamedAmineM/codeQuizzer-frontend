import { Component, OnInit } from '@angular/core';
import { Produit } from '@shared/models/produit.model';
import { ProduitService } from '../services/produit.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-produits',
  imports: [CommonModule],
  templateUrl: './produits.component.html',
  styleUrl: './produits.component.css'
})
export class ProduitsComponent implements OnInit {

     produits! : Produit[]; //un tableau de Produit

     constructor(private produitService: ProduitService ) {

      }


      ngOnInit(): void {

        this.chargerProduits();
      }

      chargerProduits(){
        this.produitService.listeProduit().subscribe(prods => {
          console.log('prods' + prods);
          this.produits = prods;
          });
      }





}
