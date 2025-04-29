// src/app/features/chef/product-form/product-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CondimentService } from '../../../core/services/condiment.service';
import { Product, ProductResponse, Condiment } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;
  productId: string | null = null;
  imagePreviewUrls: string[] = [];
  productToEdit: Product | null = null;

  categories = [
    'appetizer', 'main course', 'dessert', 'beverage', 'snack'
  ];

  commonAllergens = [
    'Dairy', 'Eggs', 'Fish', 'Shellfish', 'Tree Nuts', 
    'Peanuts', 'Wheat', 'Soy', 'Gluten', 'Sesame'
  ];

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private condimentService: CondimentService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.productForm = this.createProductForm();
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    
    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct(this.productId);
    }
  }

  createProductForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      price: ['', [Validators.required, Validators.min(0.01)]],
      category: ['', Validators.required],
      preparationTime: ['', [Validators.required, Validators.min(1)]],
      servingSize: ['', Validators.required],
      ingredients: this.fb.array([this.createIngredientControl()]),
      allergens: this.fb.array([]),
      // Add condiments form array
      condiments: this.fb.array([]),
      isVegetarian: [false],
      isVegan: [false],
      isGlutenFree: [false],
      isAvailable: [true],
      productImages: [[]]
    });
  }

  createIngredientControl() {
    return this.fb.control('', Validators.required);
  }

  createCondimentGroup(): FormGroup {
    return this.fb.group({
      _id: [null], // Will be empty for new condiments, filled for existing ones
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      isDefault: [false]
    });
  }

  get ingredients() {
    return this.productForm.get('ingredients') as FormArray;
  }

  get allergens() {
    return this.productForm.get('allergens') as FormArray;
  }

  get condiments() {
    return this.productForm.get('condiments') as FormArray;
  }

  addIngredient() {
    this.ingredients.push(this.createIngredientControl());
  }

  removeIngredient(index: number) {
    this.ingredients.removeAt(index);
  }

  // Methods for condiments
  addCondiment() {
    this.condiments.push(this.createCondimentGroup());
  }

  removeCondiment(index: number) {
    this.condiments.removeAt(index);
  }

  toggleAllergen(allergen: string) {
    const allergenIndex = this.allergens.value.findIndex((item: string) => item === allergen);
    
    if (allergenIndex === -1) {
      this.allergens.push(this.fb.control(allergen));
    } else {
      this.allergens.removeAt(allergenIndex);
    }
  }

  isAllergenSelected(allergen: string): boolean {
    return this.allergens.value.includes(allergen);
  }

  onImageChange(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.imagePreviewUrls = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviewUrls.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
      
      this.productForm.patchValue({
        productImages: files
      });
    }
  }

  loadProduct(id: string) {
    this.isLoading = true;
    this.productService.getProductById(id).subscribe({
      next: (response: ProductResponse) => {
        this.productToEdit = response.product;
        this.populateFormWithProduct(response.product);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = `Error loading product: ${err}`;
        this.isLoading = false;
      }
    });
  }

  populateFormWithProduct(product: Product) {
    // Clear existing ingredients and add new ones
    while (this.ingredients.length) {
      this.ingredients.removeAt(0);
    }
    
    if (product.ingredients && product.ingredients.length > 0) {
      product.ingredients.forEach(ingredient => {
        this.ingredients.push(this.fb.control(ingredient, Validators.required));
      });
    } else {
      this.ingredients.push(this.createIngredientControl());
    }
    
    // Clear existing allergens and add new ones
    while (this.allergens.length) {
      this.allergens.removeAt(0);
    }
    
    if (product.allergens && product.allergens.length > 0) {
      product.allergens.forEach(allergen => {
        this.allergens.push(this.fb.control(allergen));
      });
    }
    
    // Clear existing condiments and add new ones
    while (this.condiments.length) {
      this.condiments.removeAt(0);
    }
    
    if (product.condiments && product.condiments.length > 0) {
      product.condiments.forEach(condiment => {
        const condimentGroup = this.createCondimentGroup();
        condimentGroup.patchValue({
          _id: condiment._id, // Preserve the ID for existing condiments
          name: condiment.name,
          price: condiment.price,
          isDefault: condiment.isDefault
        });
        this.condiments.push(condimentGroup);
      });
    }
    
    // Set image previews if available
    if (product.images && product.images.length > 0) {
      this.imagePreviewUrls = product.images.map(image => this.productService.getImageUrl(image));
    }
    
    // Update form values
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      preparationTime: product.preparationTime,
      servingSize: product.servingSize,
      isVegetarian: product.isVegetarian,
      isVegan: product.isVegan,
      isGlutenFree: product.isGlutenFree,
      isAvailable: product.isAvailable
    });
  }

  onSubmit() {
    if (this.productForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.productForm.controls).forEach(key => {
        const control = this.productForm.get(key);
        control?.markAsTouched();
      });
      
      // Also mark condiments fields as touched
      for (let i = 0; i < this.condiments.length; i++) {
        const condimentGroup = this.condiments.at(i) as FormGroup;
        Object.keys(condimentGroup.controls).forEach(key => {
          condimentGroup.get(key)?.markAsTouched();
        });
      }
      
      return;
    }
    
    this.isSubmitting = true;
    
    // Create FormData object for file upload
    const formData = new FormData();
    
    // Add all form fields to FormData
    Object.keys(this.productForm.value).forEach(key => {
      if (key === 'productImages') {
        const files = this.productForm.get('productImages')?.value;
        if (files && files.length > 0) {
          for (let i = 0; i < files.length; i++) {
            formData.append('productImages', files[i]);
          }
        }
      } else if (key === 'ingredients' || key === 'allergens') {
        const items = this.productForm.get(key)?.value || [];
        items.forEach((item: string, index: number) => {
          formData.append(`${key}[${index}]`, item);
        });
      } else if (key === 'condiments') {
        // Use the condiment service to handle condiments properly
        const condimentsArray = this.productForm.get(key)?.value || [];
        this.condimentService.formatCondimentsForFormData(condimentsArray, formData);
      } else if (key === 'isVegetarian' || key === 'isVegan' || key === 'isGlutenFree' || key === 'isAvailable') {
        // Handle boolean values explicitly
        formData.append(key, this.productForm.get(key)?.value ? 'true' : 'false');
      } else {
        // Handle all other fields
        const value = this.productForm.get(key)?.value;
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      }
    });
    
    // Debug: Log form data
    console.log('Form data being sent:');
    for (const pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
    
    if (this.isEditMode && this.productId) {
      // Update existing product
      this.productService.updateProduct(this.productId, formData).subscribe({
        next: (response) => {
          console.log('Product updated successfully:', response);
          this.isSubmitting = false;
          this.router.navigate(['/chef/products']);
        },
        error: (err) => {
          console.error('Error updating product:', err);
          this.error = typeof err === 'string' ? err : 'An error occurred while updating the product. Please try again.';
          this.isSubmitting = false;
        }
      });
    } else {
      // Create new product
      this.productService.createProduct(formData).subscribe({
        next: (response) => {
          console.log('Product created successfully:', response);
          this.isSubmitting = false;
          this.router.navigate(['/chef/products']);
        },
        error: (err) => {
          console.error('Error creating product:', err);
          this.error = typeof err === 'string' ? err : 'An error occurred while creating the product. Please try again.';
          this.isSubmitting = false;
        }
      });
    }
  }

  // Helper methods for validation
  get nameControl() { return this.productForm.get('name'); }
  get descriptionControl() { return this.productForm.get('description'); }
  get priceControl() { return this.productForm.get('price'); }
  get categoryControl() { return this.productForm.get('category'); }
  get preparationTimeControl() { return this.productForm.get('preparationTime'); }
  get servingSizeControl() { return this.productForm.get('servingSize'); }
}