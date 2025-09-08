{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs = inputs@{ flake-parts, ... }: flake-parts.lib.mkFlake { inherit inputs; } {
    systems = [ "x86_64-linux" "aarch64-linux" ];

    perSystem = { pkgs, ... }: {
      devShells.default = pkgs.mkShellNoCC {
        packages = [
          pkgs.nodejs_22
          pkgs.typescript
          pkgs.pnpm
        ];
      };
    };
  };
}
