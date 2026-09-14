package money

import "testing"

func TestAdd(t *testing.T) {
	for _, tc := range []struct {
		a, b  Amount
		valid bool
	}{{1000, 25, true}, {0, 0, true}, {Max, 1, false}, {-1, 1, false}, {1, -1, false}, {Max + 1, 0, false}} {
		sum, err := tc.a.Add(tc.b)
		if (err == nil) != tc.valid {
			t.Fatalf("%d + %d: %v", tc.a, tc.b, err)
		}
		if tc.valid && sum != tc.a+tc.b {
			t.Fatalf("sum %d", sum)
		}
	}
}
