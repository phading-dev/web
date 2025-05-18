export default class Text {
  get locale() {
    return "en";
  }
  get marketingConsumerTabButtonLabel() {
    return `As a Viewer`;
  }
  get marketingPublisherTabButtonLabel() {
    return `As a Creator`;
  }
  get marketingExplanationTitle() {
    return `How it works`;
  }
  get marketingConsumerCtaButtonLabel() {
    return `Start watching`;
  }
  get marketingConsumerTabTitle() {
    return `Watch Without Subscriptions`;
  }
  get marketingConsumerTabMainMessage() {
    return `Enjoy high quality content without any subscription fees. Pay only for the time you watch.`;
  }
  get marketingConsumerTabExplanationPoint1() {
    return `• Watch movies, cartoons, documentaries, and tutorials without any subscription fees.`;
  }
  get marketingConsumerTabExplanationPoint2() {
    return `• Each video displays an hourly rate, set by the publisher based on quality and popularity.`;
  }
  get marketingConsumerTabExplanationPoint3() {
    return `• You are charged per second of watch time.`;
  }
  get marketingConsumerTabExplanationPoint4() {
    return `• At the end of each month, your total watch time is calculated, and your payment method is charged accordingly.`;
  }
  get marketingPublisherCtaButtonLabel() {
    return `Start earning`;
  }
  get marketingPublisherTabTitle() {
    return `Monetize Your Video`;
  }
  get marketingPublisherTabMainMessage() {
    return `Take full control of your earnings. Publish your video and set your own price.`;
  }
  get marketingPublisherTabExplanationPoint1() {
    return `• Upload any type of videos—movies, cartoons, documentaries, tutorials and more.`;
  }
  get marketingPublisherTabExplanationPoint2() {
    return `• Set an hourly rate (e.g., $1.00/hour) for each video and update it anytime based on quality and popularity.`;
  }
  get marketingPublisherTabExplanationPoint3() {
    return `• You earn for every second watched.`;
  }
  get marketingPublisherTabExplanationPoint4() {
    return [
      `• At the end of each month, your earnings (after a `, // e.g. 20%
      ` platform fee and `,
      `service fees`, // Wrap in a link
      `) are calculated and paid out.`, // TODO: Mention within X days.
    ];
  }
  get signUpTitle() {
    return `Create your new account`;
  }
  get contactEmailLabel() {
    return `Contact email`;
  }
  get naturalNameLabel() {
    return `Name`;
  }
  get accountDescriptionLabel() {
    return `Description`;
  }
  get usernameLabel() {
    return `Username`;
  }
  get recoveryEmailLabel() {
    return `Recovery email`;
  }
  get passwordLabel() {
    return `Password`;
  }
  get repeatPasswordLabel() {
    return `Confirm your password`;
  }
  get chooseUserTypeLabel() {
    return `Account type`;
  }
  get userTypeConsumerLabel() {
    return `Consumer`;
  }
  get userTypePublisherLabel() {
    return `Publisher`;
  }
  get switchToSignUpLink() {
    return `Don't have an account?`;
  }
  get naturalNameTooLongError() {
    return `Your name is too long`;
  }
  get usernameTooLongError() {
    return `Your username is too long`;
  }
  get usernameIsUsedError() {
    return `The username is already taken.`;
  }
  get passwordTooLongError() {
    return `Your password is too long`;
  }
  get repeatPasswordNotMatchError() {
    return `The two passwords don't match`;
  }
  get signUpButtonLabel() {
    return `Sign up`;
  }
  get signUpError() {
    return `Failed to sign up. Please try again.`;
  }
  get signInTitle() {
    return `Sign in to your account`;
  }
  get signInButtonLabel() {
    return `Sign in`;
  }
  get signInError() {
    return `Failed to sign in. Please check your username and password, and try again.`;
  }
  get switchToSignInLink() {
    return `Already have an account?`;
  }
  get sendTaleEntryButtonLabel() {
    return `Send`;
  }
  get saveButtonLabel() {
    return `Save`;
  }
  get cancelButtonLabel() {
    return `Cancel`;
  }
  get createAccountTitle() {
    return `Add an account`;
  }
  get createAccountButtonLabel() {
    return `Add`;
  }
  get createAccountError() {
    return `Failed to add a new account. Please try again later.`;
  }
  get chooseAccount() {
    return `Choose an account`;
  }
  get accountNotFoundError() {
    return `The requested account is not owned by you. You can sign out and sign in to the correct user.`;
  }
  get chooseAppLabel() {
    return `Switch app`;
  }
  get menuLabel() {
    return `Menu`;
  }
  get accountLabel() {
    return `Account`;
  }
  get homeLabel() {
    return `Home`;
  }
  get backLabel() {
    return `Back`;
  }
  get uploadLabel() {
    return `Upload`;
  }
  get activityLabel() {
    return `Activity`;
  }
  get exploreLabel() {
    return `Explore`;
  }
  get quickAccessLabel() {
    return `Quick links`;
  }
  get recentPremieresLabel() {
    return `Recent premieres`;
  }
  get topRatedLabel() {
    return `Top rated`;
  }
  get continueWatchingLabel() {
    return `Continue watching`;
  }
  get securitySettingsLabel() {
    return `Security settings`;
  }
  get paymentMethodsLabel() {
    return `Payment methods`;
  }
  get usageReportLabel() {
    return `Usage report`;
  }
  get chatAppName() {
    return `Chat`;
  }
  get showAppName() {
    return `Show`;
  }
  get musicAppName() {
    return `Music`;
  }
  get changeAvatarLabel() {
    return `Update`;
  }
  get switchAccountButtonLabel() {
    return `Switch account`;
  }
  get signOutButtonLabel() {
    return `Sign out`;
  }
  get chooseAvatarLabel() {
    return `Choose an image file`;
  }
  get loadImageError() {
    return `There is an issue when loading the image file. Please try again or choose a different one.`;
  }
  get previewAvatarLabel() {
    return `Previews`;
  }
  get uploadAvatarLabel() {
    return `Upload`;
  }
  get uploadAvatarError() {
    return `There is an issue when uploading your avatar. Please try again later.`;
  }
  get updateAccountInfo() {
    return `Update profile info`;
  }
  get contactEmailTooLongError() {
    return `The contact email is too long.`;
  }
  get accountDescrptionTooLongError() {
    return `The new description is too long.`;
  }
  get updatePasswordTitle() {
    return `Update password`;
  }
  get currentPasswordLabel() {
    return `Current password`;
  }
  get newPasswordLabel() {
    return `New password`;
  }
  get newPasswordTooLongError() {
    return `The new password is too long.`;
  }
  get repeatNewPasswordLabel() {
    return `Confirm new password`;
  }
  get repeatNewPasswordNotMatchError() {
    return `Please double check your new passwords. They don't match.`;
  }
  get updateUsernameTitle() {
    return `Update username`;
  }
  get newUsernameLabel() {
    return `New username`;
  }
  get updateRecoveryEmailTitle() {
    return `Update recovery email`;
  }
  get newRecoveryEmailLabel() {
    return `New email`;
  }
  get newRecoveryEmailTooLongError() {
    return `The new email is too long.`;
  }
  get updateButtonLabel() {
    return `Update`;
  }
  get updateGenericFailure() {
    return `Failed to update. Please try again later.`;
  }
  get paymentStatusTitle() {
    return `Payment status`;
  }
  get paymentStatusHealthy() {
    return [`No overdue payments. Next payment, if any, is scheduled on `, `.`];
  }
  get paymentStatusWarning() {
    return `There are failed payments. Please check or update your payment method and retry.`;
  }
  get paymentStatusRetryingPayments() {
    return `Retrying failed payments. Please check back later.`;
  }
  get retryPaymentsLabel() {
    return `Retry payments`;
  }
  get retryPaymentsGenericFailure() {
    return `Failed to retry payments. Please try again later.`;
  }
  get paymentStatusSuspended() {
    return [`Your account is currently suspended. Please contact at `, `.`];
  }
  get paymentMethodTitle() {
    return `Payment method`;
  }
  get addCardPaymentLabel() {
    return `Add`;
  }
  get cardExpires() {
    return [
      `Expires `, // E.g. 12/2023
      ``,
    ];
  }
  get cardExpired() {
    return `Expired`;
  }
  get addPaymentMethodGenericFailure() {
    return `Failed to add payment method. Please try again later.`;
  }
  get updateCardPaymentLabel() {
    return `Update`;
  }
  get paymentActivitiesTitle() {
    return `Payment activities`;
  }
  get rangeStart() {
    return `From`;
  }
  get rangeEnd() {
    return `To`;
  }
  get invaliRange() {
    return `Invalid range`;
  }
  get noActivities() {
    return `No activities`;
  }
  get paymentStateProcessing() {
    return `Processing`;
  }
  get paymentStatePaid() {
    return `Paid`;
  }
  get paymentStateFailed() {
    return `Failed`;
  }
  get payoutManagementTitle() {
    return `Manage payout`;
  }
  get completeOnboardInStripe() {
    return [
      `New here? `,
      `Complete your Stripe onboarding`,
      ` to start receiving payouts.`,
    ];
  }
  get managePayoutInStripe() {
    return [
      `View your Stripe dashboard`,
      ` to manage your bank details and payout status. Payouts are typically sent at the start of each month and may take a few days to process.`,
    ];
  }
  get payoutActivitiesTitle() {
    return `Payout activities`;
  }
  get payoutStateProcessing() {
    return `Processing`;
  }
  get payoutStatePaid() {
    return `Sent`;
  }
  get payoutStateDisabled() {
    return `Queued`;
  }
  get earningsStatementsTitle() {
    return `Earnings statements`;
  }
  get billingStatementsTitle() {
    return `Billing statements`;
  }
  get noStatements() {
    return `No statements`;
  }
  get noMoreContent() {
    return `You have reached the end.`;
  }
  get tryReloadLabel() {
    return `Try reload`;
  }
  get commentButtonLabel() {
    return `Comment`;
  }
  get commentInputPlaceholder() {
    return `What's on your mind`;
  }
  get playButtonLabel() {
    return `Play`;
  }
  get pauseButtonLabel() {
    return `Pause`;
  }
  get nextEpisodeButtonLabel() {
    return `Next`;
  }
  get speedDownButtonLabel() {
    return `Speed down`;
  }
  get speedUpButtonLabel() {
    return `Speed up`;
  }
  get skipBackwardButtonLabel() {
    return `Jump 10 seconds backwards`;
  }
  get skipForwardButtonLabel() {
    return `Jump 10 seconds forwards`;
  }
  get volumeDownButtonLabel() {
    return `Volume down`;
  }
  get volumeUpButtonLabel() {
    return `Volume up`;
  }
  get chatOverlayTurnOnButtonLabel() {
    return `Turn on chat overlay`;
  }
  get chatOverlayTurnOffButtonLabel() {
    return `Turn off chat overlay`;
  }
  get playerOpenSidePanelButtonLabel() {
    return `More`;
  }
  get interruptReasonNoConnectivity() {
    return `Video stopped. No internet connection.`;
  }
  get pricingRateShortened() {
    return [``, ` / hr`];
  }
  get pricingRate() {
    return [``, ` / hour`];
  }
  get currentRate() {
    return `Current rate: `;
  }
  get billedMonthly() {
    return ` - Billed monthly based on seconds watched.`;
  }
  get newPricingStarting() {
    return [` - New rate: `, ` starting in `, ` days.`, ` day.`];
  }
  get viewHistoryLink() {
    return `View history >`;
  }
  get viewMoreLink() {
    return `View more >`;
  }
  get continueWatchingTitle() {
    return `Continue watching`;
  }
  get recentPremieresTitle() {
    return `Recent premieres`;
  }
  get topRatedTitle() {
    return `Top rated`;
  }
  get searchResultTitle() {
    return [`Searching for "`, `"`];
  }
  get estimatedChargeTitle() {
    return `Estimated charge`;
  }
  get billingMonth() {
    return [`Current billing month is `, `.`];
  }
  get viewDetailedUsageLabel() {
    return `View full breakdown >`;
  }
  get watchHistoryTitle() {
    return `Watch history`;
  }
  get usageReportTitle() {
    return `Usage report`;
  }
  get usageReportSelectOneDayLabel() {
    return `One day`;
  }
  get usageReportSelectDaysLabel() {
    return `Days`;
  }
  get usageReportSelectOneMonthLabel() {
    return `One month`;
  }
  get usageReportSelectMonths() {
    return `Months`;
  }
  get watchLaterTitle() {
    return `Watch later`;
  }
  get watchLaterLabel() {
    return `Watch later`;
  }
  get watchLaterRemoveLabel() {
    return `Saved for later`;
  }
  get shareLabel() {
    return `Share`;
  }
  get shareLinkCopiedLabel() {
    return `Link copied!`;
  }
  get episodePremieredOn() {
    return `Premiered on `;
  }
  get episodePremieresAt() {
    return `Premieres at `;
  }
  get totalEpisodes() {
    return [``, ` total episodes`];
  }
  get showMoreButtonLabel() {
    return `Read more`;
  }
  get showLessButtonLabel() {
    return `Show less`;
  }
  get loadMorePrevEpisodesButtonLabel() {
    return `More previous episodes`;
  }
  get loadMoreNextEpisodesButtonLabel() {
    return `More episodes`;
  }
  get currentMetering() {
    return `Estimated charges: `;
  }
  get currentMeteringExplained() {
    return `Estimated for the current watching session. Charges are not final until the end of the current billing month.`;
  }
  get nextEpisode() {
    return `Next episode:`;
  }
  get noNextEpisode() {
    return `No upcoming episode`;
  }
  get videoPlayGeneralSettingsLabel() {
    return `General settings`;
  }
  get subtitleOptionsLabel() {
    return `Subtitle`;
  }
  get subtitleOptionOff() {
    return `Off`;
  }
  get subtitleOptionsNotAvailable() {
    return `Not available`;
  }
  get audioOptionsLabel() {
    return `Audio`;
  }
  get audioOptionsNotAvailable() {
    return `Not available`;
  }
  get commentOverlaySettingsLabel() {
    return `Settings for chat overlay`;
  }
  get commentOverlayStyleLabel() {
    return `Style`;
  }
  get commentOverlayStyleDisabledOptionLabel() {
    return `Disabled`;
  }
  get commentOverlayStyleSideOptionLabel() {
    return `On the side`;
  }
  get commentOverlayStyleDanmakuOptionLabel() {
    return `Scrolling`;
  }
  get commentOverlayOpacityLabel() {
    return `Opacity`;
  }
  get commentOverlayFontSizeLabel() {
    return `Font size`;
  }
  get danmakuOverlaySettingsLabel() {
    return `Settings for scrolling chats overlay`;
  }
  get danmakuOverlaySpeedLabel() {
    return `Speed`;
  }
  get danmakuOverlayDensityLabel() {
    return `Density`;
  }
  get danmakuOverlayStackingMethodLabel() {
    return `Stacking`;
  }
  get danmakuOverlayStackingRandomOptionLabel() {
    return `Random`;
  }
  get danmakuOverlayStackingTopDownOptionLabel() {
    return `Top down`;
  }
  get totalPublishedEpisodes() {
    return [``, ` published episodes`];
  }
  get seasonLastChangeTime() {
    return `Last updated: `;
  }
  get noCoverImage() {
    return `No cover image`;
  }
  get publishedSeasonsTitle() {
    return `Published`;
  }
  get draftSeasonsTitle() {
    return `Drafts`;
  }
  get archivedSeasonsTitle() {
    return `Archived`;
  }
  get searchPublishedSeasonsTitle() {
    return [`Searching for published "`, `"`];
  }
  get searchDraftSeasonsTitle() {
    return [`Searching for drafts "`, `"`];
  }
  get searchArchivedSeasonsTitle() {
    return [`Searching for archived "`, `"`];
  }
  get createSeasonTitle() {
    return `Create new draft`;
  }
  get seasonNameLabel() {
    return `Name`;
  }
  get seasonNameTooLongError() {
    return `The name is too long.`;
  }
  get createSeasonButtonLabel() {
    return `Create`;
  }
  get createSeasonError() {
    return `Failed to create a new draft. Please try again later.`;
  }
  get seasonDescriptionLabel() {
    return `Description`;
  }
  get seasonAddCoverImageLabel() {
    return `Add cover image`;
  }
  get seasonPricingLabel() {
    return `Pricing`;
  }
  get seasonCurrentRateLabel() {
    return `Current rate: `;
  }
  get seasonDraftPricingFooter() {
    return `Before publishing, you can change the rate anytime.`;
  }
  get seasonPublishedPricingFooter() {
    return [
      `In order to maintain stable pricing, at least `,
      `-day notice is required to change the rate.`,
    ];
  }
  get seasonArchivedPricingFooter() {
    return `Rate cannot be changed anymore.`;
  }
  get seasonNewRateLabel() {
    return `Upcoming rate: `;
  }
  get seasonNewRateEffectiveDateLabel() {
    return `Effective date: `;
  }
  get seasonStateLabel() {
    return `State`;
  }
  get seasonStateDraftLabel() {
    return `Draft`;
  }
  get seasonStateDraftFooter() {
    return `No information is visible to the public. It will be published when the first episode is published.`;
  }
  get seasonStatePublishedLabel() {
    return `Published`;
  }
  get seasonStatePublishedFooter() {
    return `All information is visible to the public. Published episodes are visible but not watchable until their premiere time.`;
  }
  get seasonStateArchivedLabel() {
    return `Archived`;
  }
  get seasonStateArchivedFooter() {
    return `Name and pricing remain visible to the public.`;
  }
  get seasonCreatedTime() {
    return `Created: `;
  }
  get seasonTotalDraftEpisodes() {
    return [``, ` draft episodes`];
  }
  get seasonCreateDraftEpisodeLabel() {
    return `Add a draft episode`;
  }
  get seasonEpisodeVersion() {
    return `Version: `;
  }
  get seasonTotalPublishedEpisodes() {
    return [``, ` published episodes`];
  }
  get seasonPublishedEpisodeIndex() {
    return `# `;
  }
  get seasonPublishedEpisodesStartFromLabel() {
    return `Latest from #`;
  }
  get seasonAllPublishedEpisodesLoaded() {
    return `All published episodes are listed.`;
  }
  get seasonEpisodeNameLabel() {
    return `Episode name`;
  }
  get seasonEpisodeIndex() {
    return [`Index: `, ` of `, ``];
  }
  get seasonEpisodeIndexFooter() {
    return `To solely determine the order of the episodes.`;
  }
  get seasonEpisodeStateLabel() {
    return `State`;
  }
  get seasonEpisodeStateDraft() {
    return `Draft`;
  }
  get seasonEpisodeStateNoVideoFooter() {
    return `You need to upload and compile a video before publishing.`;
  }
  get seasonEpisodeStateDraftFooter() {
    return `The compiled video is not visible to the public.`;
  }
  get seasonEpisodeStatePublished() {
    return `Published`;
  }
  get seasonHasPremieredAt() {
    return `Has premiered at: `;
  }
  get seasonPremieresAt() {
    return `Scheduled to premiere at: `;
  }
  get seasonEpisodeVideoTitle() {
    return `Video`;
  }
  get seasonEpisodeVideoExplanation() {
    return `A video is compiled with video tracks, audio tracks and subtitle tracks. Once a file is uploaded and processed, you can edit the tracks below and compile the video.`;
  }
  get seasonEpisodeFailedProcessingLabel() {
    return `Failed to process file.`;
  }
  get seasonEpisodeVideoCodecRequiresH264() {
    return `Video codec must be H.264.`;
  }
  get seasonEpisodeAudioCodecRequiresAac() {
    return `Audio codec must be AAC.`;
  }
  get seasonEpisodeSubtitleZipFormatInvalid() {
    return `ZIP file is invalid.`;
  }
  get seasonEpisodeVideoUploadLabel() {
    return `Upload`;
  }
  get seasonEpisodeVideoResumeUploadLabel() {
    return `Resume uploading`;
  }
  get seasonEpisodeVideoProcessingLabel() {
    return `Processing...Please check back later.`;
  }
  get seasonEpisodeNoVersion() {
    return `Compile the first version.`;
  }
  get seasonEpisodeCommittedVersionLabel() {
    return [`Version `, ` compiled.`];
  }
  get seasonEpisodeCommittedVersionNoChangesFooter() {
    return `Everything is up to date.`;
  }
  get seasonEpisodeCommittedVersionPendingChangesFooter() {
    return `There are pending changes to compile.`;
  }
  get seasonEpisodeCommittingVersionLabel() {
    return [`Version `, ` compiling...`];
  }
  get seasonEpisodeCommittingFirstVersionLabel() {
    return `You can publish the episode once compiled.`;
  }
  get seasonEpisodeCommittingVersionNoMoreChangesFooter() {
    return `The old video is still available while the new one is being compiled.`;
  }
  get seasonEpisodeCommittingVersionNewPendingChangesFooter() {
    return `There are new pending changes to compile.`;
  }
  get seasonEpisodeVideoTracksTitle() {
    return `Video tracks`;
  }
  get seasonEpisodeTrackStateLabel() {
    return `State`;
  }
  get seasonEpisodeAudioTracksTitle() {
    return `Audio tracks`;
  }
  get seasonEpisodeSubtitleTracksTitle() {
    return `Subtitle tracks`;
  }
  get seasonEpisodeTrackStateCommittedLabel() {
    return `Added`;
  }
  get seasonEpisodeTrackStatePendingLabel() {
    return `Pending`;
  }
  get seasonEpisodeTrackVideoDurationLabel() {
    return `Duration`;
  }
  get seasonEpisodeTrackVideoResolutionLabel() {
    return `Resolution`;
  }
  get seasonEpisodeTrackNameLabel() {
    return `Name`;
  }
  get seasonEpisodeTrackIsDefaultLabel() {
    return `Default`;
  }
  get seasonEpisodeTrackIsDefaultYesValue() {
    return `Yes`;
  }
  get seasonEpisodeTrackIsDefaultNoValue() {
    return `No`;
  }
}
