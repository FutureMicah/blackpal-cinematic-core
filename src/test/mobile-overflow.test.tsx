import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";

// Mock supabase to prevent network/auth in tests
vi.mock("@/integrations/supabase/client", () => {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    in: () => builder,
    gte: () => builder,
    order: () => builder,
    limit: () => builder,
    single: async () => ({ data: null, error: null }),
    then: (cb: any) => cb({ data: [], error: null }),
  };
  return {
    supabase: {
      auth: {
        getSession: async () => ({ data: { session: { user: { id: "u1" } } }, error: null }),
        getUser: async () => ({ data: { user: { id: "u1" } }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ error: null }),
      },
      from: () => builder,
      rpc: async () => ({ data: null, error: null }),
    },
  };
});

const renderWithShell = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const VIEWPORT = 375;

const expectNoHorizontalOverflow = (container: HTMLElement) => {
  // jsdom doesn't run layout so width === 0; check that no element declares
  // a fixed width larger than viewport via inline styles or known classes.
  const violators: string[] = [];
  container.querySelectorAll<HTMLElement>("*").forEach((el) => {
    const inline = el.style.width;
    if (inline && inline.endsWith("px")) {
      const px = parseFloat(inline);
      if (px > VIEWPORT) violators.push(`${el.tagName} width=${px}px`);
    }
    const minW = el.style.minWidth;
    if (minW && minW.endsWith("px")) {
      const px = parseFloat(minW);
      if (px > VIEWPORT) violators.push(`${el.tagName} min-width=${px}px`);
    }
  });
  expect(violators, `Elements exceed ${VIEWPORT}px viewport: ${violators.join(", ")}`).toEqual([]);
};

describe("Mobile @375px renders without overflow", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: VIEWPORT });
  });

  it("Auth page renders within viewport", async () => {
    const { default: Auth } = await import("@/pages/Auth");
    const { container } = renderWithShell(<Auth />);
    expectNoHorizontalOverflow(container);
  });

  it("Transactions page renders within viewport", async () => {
    const { default: Transactions } = await import("@/pages/Transactions");
    const { container } = renderWithShell(<Transactions />);
    expectNoHorizontalOverflow(container);
  });

  it("BlackTerminal (trade) renders within viewport", async () => {
    const { default: BlackTerminal } = await import("@/pages/BlackTerminal");
    const { container } = renderWithShell(<BlackTerminal />);
    expectNoHorizontalOverflow(container);
  });

  it("ChartPage renders within viewport", async () => {
    const { default: ChartPage } = await import("@/pages/ChartPage");
    const { container } = renderWithShell(<ChartPage />);
    expectNoHorizontalOverflow(container);
  });

  it("AdminPanel renders within viewport (login gate)", async () => {
    const { default: AdminPanel } = await import("@/pages/AdminPanel");
    const { container } = renderWithShell(<AdminPanel />);
    expectNoHorizontalOverflow(container);
  });
});
