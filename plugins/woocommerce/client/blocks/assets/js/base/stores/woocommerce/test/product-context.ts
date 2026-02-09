/**
 * External dependencies
 */
import type { ProductResponseItem } from '@woocommerce/types';

/**
 * Internal dependencies
 */
import type { ProductContextStore } from '../product-context';

type MockStore = {
	state: ProductContextStore[ 'state' ];
	actions: ProductContextStore[ 'actions' ];
};

let mockRegisteredStore: MockStore | null = null;
let mockProductsState: {
	products: Record< number, ProductResponseItem >;
	productVariations: Record< number, ProductResponseItem >;
};
let mockContext: { productId?: number; variationId?: number | null } | null =
	null;

const mockProduct = {
	id: 42,
	name: 'Test Product',
} as ProductResponseItem;

const mockVariation = {
	id: 99,
	name: 'Test Variation',
} as ProductResponseItem;

jest.mock(
	'@wordpress/interactivity',
	() => ( {
		store: jest.fn( ( namespace, definition ) => {
			if ( namespace === 'woocommerce/products' ) {
				return {
					state: mockProductsState,
				};
			}
			if ( namespace === 'woocommerce/product-context' ) {
				// Simulate server-hydrated state merged with client definition.
				// Getters from definition.state are preserved, and templateState
				// is added as a plain object (simulating wp_interactivity_state).
				const stateBase = {
					templateState: { productId: 0, variationId: null },
				};
				const descriptors = Object.getOwnPropertyDescriptors(
					definition.state
				);
				Object.defineProperties( stateBase, descriptors );

				mockRegisteredStore = {
					state: stateBase as MockStore[ 'state' ],
					actions: definition.actions,
				};
				return mockRegisteredStore;
			}
			return {};
		} ),
		getContext: jest.fn( () => mockContext ),
	} ),
	{ virtual: true }
);

describe( 'woocommerce/product-context store', () => {
	beforeEach( () => {
		mockRegisteredStore = null;
		mockContext = null;
		mockProductsState = {
			products: { 42: mockProduct },
			productVariations: { 99: mockVariation },
		};

		jest.isolateModules( () => require( '../product-context' ) );
	} );

	describe( 'templateState fallback (no block context)', () => {
		it( 'productId reads from templateState when no context', () => {
			expect( mockRegisteredStore ).not.toBeNull();

			mockRegisteredStore!.state.templateState.productId = 42;

			expect( mockRegisteredStore!.state.productId ).toBe( 42 );
		} );

		it( 'variationId reads from templateState when no context', () => {
			expect( mockRegisteredStore ).not.toBeNull();

			mockRegisteredStore!.state.templateState.variationId = 99;

			expect( mockRegisteredStore!.state.variationId ).toBe( 99 );
		} );
	} );

	describe( 'block context (inside Single Product block)', () => {
		it( 'productId reads from context when available', () => {
			expect( mockRegisteredStore ).not.toBeNull();

			mockRegisteredStore!.state.templateState.productId = 1;
			mockContext = { productId: 42, variationId: null };

			expect( mockRegisteredStore!.state.productId ).toBe( 42 );
		} );

		it( 'variationId reads from context when available', () => {
			expect( mockRegisteredStore ).not.toBeNull();

			mockRegisteredStore!.state.templateState.variationId = 1;
			mockContext = { productId: 42, variationId: 99 };

			expect( mockRegisteredStore!.state.variationId ).toBe( 99 );
		} );
	} );

	describe( 'actions', () => {
		it( 'setProductId updates templateState when no context', () => {
			expect( mockRegisteredStore ).not.toBeNull();

			mockRegisteredStore!.actions.setProductId( 100 );

			expect( mockRegisteredStore!.state.templateState.productId ).toBe(
				100
			);
		} );

		it( 'setVariationId updates templateState when no context', () => {
			expect( mockRegisteredStore ).not.toBeNull();

			mockRegisteredStore!.actions.setVariationId( 200 );

			expect( mockRegisteredStore!.state.templateState.variationId ).toBe(
				200
			);
		} );

		it( 'setVariationId accepts null to clear selection', () => {
			expect( mockRegisteredStore ).not.toBeNull();

			mockRegisteredStore!.actions.setVariationId( 200 );
			mockRegisteredStore!.actions.setVariationId( null );

			expect(
				mockRegisteredStore!.state.templateState.variationId
			).toBeNull();
		} );

		it( 'setProductId updates context when available', () => {
			expect( mockRegisteredStore ).not.toBeNull();

			mockContext = { productId: 1, variationId: null };
			mockRegisteredStore!.actions.setProductId( 100 );

			expect( mockContext.productId ).toBe( 100 );
		} );

		it( 'setVariationId updates context when available', () => {
			expect( mockRegisteredStore ).not.toBeNull();

			mockContext = { productId: 42, variationId: null };
			mockRegisteredStore!.actions.setVariationId( 200 );

			expect( mockContext.variationId ).toBe( 200 );
		} );
	} );

	describe( 'computed getters', () => {
		it( 'parentProduct returns the product from the products store', () => {
			expect( mockRegisteredStore ).not.toBeNull();

			mockRegisteredStore!.state.templateState.productId = 42;

			expect( mockRegisteredStore!.state.parentProduct ).toBe(
				mockProduct
			);
		} );

		it( 'selectedVariation returns the variation from the products store', () => {
			expect( mockRegisteredStore ).not.toBeNull();

			mockRegisteredStore!.state.templateState.variationId = 99;

			expect( mockRegisteredStore!.state.selectedVariation ).toBe(
				mockVariation
			);
		} );

		it( 'selectedVariation returns undefined when variationId is null', () => {
			expect( mockRegisteredStore ).not.toBeNull();

			mockRegisteredStore!.state.templateState.variationId = null;

			expect(
				mockRegisteredStore!.state.selectedVariation
			).toBeUndefined();
		} );

		it( 'product returns selected variation when set, otherwise parent product', () => {
			expect( mockRegisteredStore ).not.toBeNull();

			mockRegisteredStore!.state.templateState.productId = 42;
			mockRegisteredStore!.state.templateState.variationId = 99;

			expect( mockRegisteredStore!.state.product ).toBe( mockVariation );

			mockRegisteredStore!.actions.setVariationId( null );

			expect( mockRegisteredStore!.state.product ).toBe( mockProduct );
		} );
	} );
} );
