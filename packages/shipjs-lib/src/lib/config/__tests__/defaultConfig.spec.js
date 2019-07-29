import defaultConfig from '../defaultConfig';
const {
  formatCommitMessage,
  formatPullRequestMessage,
  mergeStrategy: defaultMergeStrategy,
  shouldRelease,
} = defaultConfig;

describe('defaultConfig', () => {
  it('should export an object', () => {
    expect(defaultConfig).toMatchObject(expect.objectContaining({}));
  });

  it('formatCommitMessage', () => {
    const nextVersion = '0.1.2';
    expect(formatCommitMessage({ nextVersion })).toBe(`chore: release v0.1.2`);
  });

  describe('formatPullRequestMessage', () => {
    const repoURL = 'https://github.com/algolia/shipjs';
    const baseBranch = 'master';
    const stagingBranch = 'releases/v0.1.1';
    const currentVersion = '0.1.0';
    const nextVersion = '0.1.1';

    it('gets message for same branch strategy', () => {
      const mergeStrategy = {
        toSameBranch: ['master'],
        toReleaseBranch: {},
      };
      const destinationBranch = 'master';
      const message = formatPullRequestMessage({
        repoURL,
        baseBranch,
        stagingBranch,
        destinationBranch,
        mergeStrategy,
        currentVersion,
        nextVersion,
      });
      expect(message).toMatchInlineSnapshot(`
                                        "chore: release v0.1.1

                                        ## Release Summary
                                        - Version change: \`v0.1.0\` → \`v0.1.1\`
                                        - Merge: \`releases/v0.1.1\` → \`master\`
                                        - [Compare the changes between the versions](https://github.com/algolia/shipjs/compare/v0.1.0...releases/v0.1.1)"
                              `);
      expect(message).toEqual(
        expect.stringContaining('Compare the changes between the versions')
      );
    });

    it('gets message for release branch strategy', () => {
      const mergeStrategy = {
        toSameBranch: [],
        toReleaseBranch: {
          master: 'release/stable',
        },
      };
      const destinationBranch = 'release/stable';
      expect(
        formatPullRequestMessage({
          repoURL,
          baseBranch,
          stagingBranch,
          destinationBranch,
          mergeStrategy,
          currentVersion,
          nextVersion,
        })
      ).toMatchInlineSnapshot(`
                                "chore: release v0.1.1

                                ## Release Summary
                                - Version change: \`v0.1.0\` → \`v0.1.1\`
                                - Merge: \`releases/v0.1.1\` → \`release/stable\`
                                "
                        `);
    });
  });

  it('gets default mergeStrategy', () => {
    expect(defaultMergeStrategy).toMatchInlineSnapshot(`
                  Object {
                    "toSameBranch": Array [
                      "master",
                    ],
                  }
            `);
  });

  describe('shouldRelease', () => {
    const currentVersion = '0.1.2';
    const commitMessage = 'chore: release v0.1.2';

    it('returns error with wrong commit message', () => {
      const mergeStrategy = {
        toSameBranch: ['master'],
        toReleaseBranch: {},
      };
      const currentBranch = 'master';
      const result = shouldRelease({
        commitMessage: '',
        currentVersion,
        currentBranch,
        mergeStrategy,
      });
      expect(result).toMatchInlineSnapshot(`
                "The commit message should have started with the following:
                chore: release v0.1.2"
            `);
    });

    it('returns true with same branch strategy', () => {
      const mergeStrategy = {
        toSameBranch: ['master'],
        toReleaseBranch: {},
      };
      const currentBranch = 'master';
      const result = shouldRelease({
        commitMessage,
        currentVersion,
        currentBranch,
        mergeStrategy,
      });
      expect(result).toBe(true);
    });

    it('returns true with release branch strategy', () => {
      const mergeStrategy = {
        toSameBranch: [],
        toReleaseBranch: {
          master: 'release/stable',
        },
      };
      const currentBranch = 'release/stable';
      const result = shouldRelease({
        commitMessage,
        currentVersion,
        currentBranch,
        mergeStrategy,
      });
      expect(result).toBe(true);
    });

    it('returns error without matching any strategy', () => {
      const mergeStrategy = {
        toSameBranch: ['master'],
        toReleaseBranch: {
          dev: 'release/legacy',
        },
      };
      const currentBranch = 'develop';
      const result = shouldRelease({
        commitMessage,
        currentVersion,
        currentBranch,
        mergeStrategy,
      });
      expect(result).toMatchInlineSnapshot(
        `"The current branch needs to be one of [master, release/legacy]"`
      );
    });
  });
});