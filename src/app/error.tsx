"use client";

import { useEffect } from "react";
import { routes } from "@/config/routes";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Layout";
import { ErrorState } from "@/components/ui/States";
import { RefreshIcon } from "@/components/icons";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-16 sm:py-24">
      <ErrorState
        title="This page couldn’t be loaded"
        description="Something unexpected went wrong. Please try again. If the problem continues, go back to the homepage."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => retry()}>
              <RefreshIcon className="size-4" />
              Try again
            </Button>
            <ButtonLink href={routes.home} variant="secondary">
              Go to homepage
            </ButtonLink>
          </div>
        }
      />
    </Container>
  );
}
