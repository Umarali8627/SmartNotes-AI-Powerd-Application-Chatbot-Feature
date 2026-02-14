import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { BookOpen, ArrowRight } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-lg text-center"
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/10">
          <BookOpen className="h-10 w-10 text-accent" />
        </div>

        <h1 className="font-display text-5xl font-bold tracking-tight text-foreground">
          Smart<span className="text-accent">Notes</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          Organize your subjects and notes in one beautiful, focused space.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {!loading && user ? (
            <Button
              size="lg"
              className="bg-accent text-accent-foreground shadow-accent hover:bg-accent/90"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                className="bg-accent text-accent-foreground shadow-accent hover:bg-accent/90"
                onClick={() => navigate("/register")}
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
