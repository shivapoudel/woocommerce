/**
 * External dependencies
 */
import { store, getContext } from '@wordpress/interactivity';
import type { ProductResponseItem } from '@woocommerce/types';
import type { ProductsStore } from '@woocommerce/stores/woocommerce/products';

// Stores are locked to prevent 3PD usage until the API is stable.
const universalLock =
	'I acknowledge that using a private store means my plugin will inevitably break on the next store release.';

const productsStore = store< ProductsStore >( 'woocommerce/products', {
	state: {
		products: {},
		productVariations: {},
	},
} );

/**
 * The context shape set by the woocommerce/single-product block. When the
 * add-to-cart-with-options block (or any other consumer) renders inside a
 * Single Product block, this per-element context takes precedence over the
 * global template state so that each product in a loop gets its own IDs.
 */
type SingleProductContext = {
	productId: number;
	variationId: number | null;
};

export type ProductContextState = {
	productId: number;
	variationId: number | null;
	templateState: {
		productId: number;
		variationId: number | null;
	};
};

const productContextStore = store< {
	state: ProductContextState & {
		parentProduct: ProductResponseItem | undefined;
		selectedVariation: ProductResponseItem | undefined;
		product: ProductResponseItem | undefined;
	};
	actions: {
		setProductId: ( productId: number ) => void;
		setVariationId: ( variationId: number | null ) => void;
	};
} >(
	'woocommerce/product-context',
	{
		state: {
			get productId(): number {
				const context = getContext< SingleProductContext >(
					'woocommerce/single-product'
				);
				return (
					context?.productId ??
					productContextStore.state.templateState?.productId
				);
			},
			get variationId(): number | null {
				const context = getContext< SingleProductContext >(
					'woocommerce/single-product'
				);
				return (
					context?.variationId ??
					productContextStore.state.templateState?.variationId
				);
			},
			get parentProduct(): ProductResponseItem | undefined {
				return productsStore.state.products[
					productContextStore.state.productId
				];
			},
			get selectedVariation(): ProductResponseItem | undefined {
				const { variationId } = productContextStore.state;
				if ( variationId === null ) {
					return undefined;
				}
				return productsStore.state.productVariations[ variationId ];
			},
			get product(): ProductResponseItem | undefined {
				return (
					productContextStore.state.selectedVariation ??
					productContextStore.state.parentProduct
				);
			},
		},
		actions: {
			setProductId: ( productId: number ) => {
				const context = getContext< SingleProductContext >(
					'woocommerce/single-product'
				);
				if ( context?.productId !== undefined ) {
					context.productId = productId;
				} else {
					productContextStore.state.templateState.productId =
						productId;
				}
			},
			setVariationId: ( variationId: number | null ) => {
				const context = getContext< SingleProductContext >(
					'woocommerce/single-product'
				);
				if ( context?.variationId !== undefined ) {
					context.variationId = variationId;
				} else {
					productContextStore.state.templateState.variationId =
						variationId;
				}
			},
		},
	},
	{ lock: universalLock }
);

export type ProductContextStore = typeof productContextStore;
