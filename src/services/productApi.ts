export type ProductLookup = {
  barcode: string;
  name: string;
  brand: string;
  quantity: string;
  category: string;
  sizeAmount: number | null;
  sizeUnit: string;
};

export default async function lookupProduct(
  barcode: string
): Promise<ProductLookup | null> {
  try {
    console.log('lookupProduct function started:', barcode);

    const fields = [
      'code',
      'product_name',
      'brands',
      'quantity',
      'product_quantity',
      'product_quantity_unit',
      'categories',
    ].join(',');

    const url =
      `https://world.openfoodfacts.org/api/v3/product/${barcode}` +
      `?product_type=all&cc=us&lc=en&fields=${fields}`;

    console.log('API URL:', url);

    const response = await fetch(url);

    console.log('API status:', response.status);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    console.log('API response:', data);

    if (!data.product) {
      return null;
    }

    const product = data.product;

    return {
      barcode: product.code ?? barcode,
      name: product.product_name || 'Unknown Product',
      brand: product.brands || '',
      quantity: product.quantity || '',
      category: product.categories || '',
      sizeAmount: product.product_quantity
        ? Number(product.product_quantity)
        : null,
      sizeUnit: product.product_quantity_unit || '',
    };
  } catch (error) {
    console.error('PRODUCT LOOKUP ERROR:', error);
    return null;
  }
}